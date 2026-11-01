# check=skip=FromPlatformFlagConstDisallowed
# Tilde, built in stages so nothing but Docker is needed:
#   guest    the Linux that runs in the browser (always 32-bit: v86 emulates an i686, hence the fixed --platform)
#   flatten  that filesystem in v86's 9p format, plus the BIOS files
#   state    boots it once in node and saves a snapshot, so the page starts in seconds instead of ~30
#   v86      just the files from the last three, for local dev: image/build.sh exports it into public/v86/
#   web      the Vite build
#   site     the site and the v86 files, for static hosting
#   (final)  nginx serving the site and the v86 files
# Build from the repo root: docker build .

# The Linux the game runs in the browser: 32-bit Alpine (v86 emulates an i686) with bash and the GNU tools,
# so commands behave the way they do on a real Linux box rather than BusyBox's cut-down versions.
FROM --platform=linux/386 docker.io/i386/alpine:3.21.0 AS guest

RUN apk add --no-cache openrc alpine-base agetty linux-virt linux-firmware-none \
    bash bash-completion coreutils findutils grep sed gawk diffutils less file tree nano util-linux ncurses-terminfo-base \
    procps-ng tar gzip

# Man pages, so `man uniq` works. 9p fetches files only when they're opened, so these cost nothing at startup.
RUN apk add --no-cache mandoc man-pages bash-doc coreutils-doc findutils-doc grep-doc sed-doc gawk-doc \
    diffutils-doc less-doc file-doc tree-doc nano-doc util-linux-doc procps-ng-doc tar-doc gzip-doc

# ttyS0 is the player's terminal: straight into bash as `player`, no login banner.
# ttyS1 is the game's private channel: the agent runs checks there, out of the player's sight.
RUN sed -i '/^tty[0-9]/d' /etc/inittab \
 && echo 'ttyS0::respawn:/usr/local/bin/player-shell' >> /etc/inittab \
 && echo 'ttyS1::respawn:/usr/local/bin/game-agent' >> /etc/inittab \
 && echo "root:" | chpasswd \
 && adduser -D -s /bin/bash player && passwd -d player && install -d -o player -g player /home/player/work \
 && mkdir -p /var/game && chmod 755 /var/game \
 && touch /var/game/history && chown player /var/game/history \
 && : > /etc/motd && setup-hostname tilde

COPY image/game-agent image/player-shell /usr/local/bin/
COPY image/bashrc /home/player/.bashrc
# A clean copy, for levels that have you edit ~/.bashrc to start from.
COPY image/bashrc /usr/local/share/tilde/bashrc
COPY image/bash_profile /home/player/.bash_profile
RUN chmod 755 /usr/local/bin/game-agent /usr/local/bin/player-shell && chown player:player /home/player/.bashrc /home/player/.bash_profile

RUN for i in devfs dmesg mdev; do rc-update add $i sysinit; done \
 && for i in modules sysctl hostname bootmisc; do rc-update add $i boot; done \
 && rc-update add killprocs shutdown

RUN mkinitfs -F "base virtio 9p" $(cat /usr/share/kernel/virt/kernel.release)

FROM python:3.13-alpine AS flatten
WORKDIR /out
# The BIOS files, from the v86 repo at the commit the npm package was built from. (ADD from a URL makes
# files mode 600, which nginx can't serve.)
ADD --chmod=644 --checksum=sha256:73e3f359102e3a9982c35fce98eb7cd08f18303ac7f1ba6ebfbe6cdc1c244d98 \
    https://raw.githubusercontent.com/copy/v86/cc37f35c43bf14865d74ad76879ecf9410f69eb1/bios/seabios.bin ./
ADD --chmod=644 --checksum=sha256:a4bc0d80cc3ca028c73dafa8fee396b8d054ce87ebd8abfbd31b06b437607880 \
    https://raw.githubusercontent.com/copy/v86/cc37f35c43bf14865d74ad76879ecf9410f69eb1/bios/vgabios.bin ./
COPY image/tools /tools
COPY image/licenses /licenses
# A bind mount (not COPY) keeps the guest's file owners and modes exactly, setuid bits included.
RUN --mount=type=bind,from=guest,target=/rootfs \
    apk add --no-cache tar \
 && cd /rootfs && tar -cf /tmp/rootfs.tar $(ls -A) \
 && python3 /tools/fs2json.py --out /out/fs.json /tmp/rootfs.tar \
 && mkdir /out/rootfs && python3 /tools/copy-to-sha256.py /tmp/rootfs.tar /out/rootfs >/dev/null \
 && rm /tmp/rootfs.tar \
 && python3 /tools/guest-notices.py /rootfs /licenses /out/third-party.txt

FROM node:22-alpine AS deps
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS state
RUN apk add --no-cache zstd
COPY image/save-state.mjs image/
COPY --from=flatten /out public/v86/
RUN node image/save-state.mjs

FROM scratch AS v86
COPY --from=state /src/public/v86/ /

FROM deps AS web
COPY . .
RUN npm run build

# Just the finished site, for static hosting: docker build --target site --output type=local,dest=site .
FROM scratch AS site
COPY --from=web /src/dist /
COPY --from=v86 / /v86/

FROM nginx:1.28-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web /src/dist /usr/share/nginx/html
COPY --from=v86 / /usr/share/nginx/html/v86/
EXPOSE 80
