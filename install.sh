#!/bin/bash

set -e

log() {
    echo -e "\e[34m[$(date)]\e[0m $1"
}

error() {
    echo -e "\e[31m[$(date)]\e[0m $1"
    exit 1
}

# NASP installation script
# This script installs the NASP packages, adds the NASP repository and key,
# enables and starts the systemd unit, and loads the "nasp" kernel module.

# Define the packages you want to install
PACKAGES=("nasp")

# URL of your NASP repository
NASP_REPO_URL="https://nasp.rocks"

# Function to check if a package is installed
is_package_installed() {
    dpkg -l "$1" &>/dev/null || rpm -q "$1" &>/dev/null
}

# Function to install a package
install_package() {
    if [ -x "$(command -v apt)" ]; then
        # Debian/Ubuntu
        sudo apt update
        sudo apt install -y "$1"
    elif [ -x "$(command -v dnf)" ]; then
        # CentOS/RHEL
        sudo dnf install -y "$1"
    else
        error "Unsupported package manager. Please install packages manually."
    fi
}

# Function to add NASP repository and key
add_nasp_repo_and_key() {
    log "Adding NASP repository and key..."
    if [ -x "$(command -v apt)" ]; then
        # Debian/Ubuntu
        sudo sh -c "echo 'deb $NASP_REPO_URL/packages/deb stable main' > /etc/apt/sources.list.d/nasp.list"
        sudo wget -O /tmp/nasp.asc "$NASP_REPO_URL/packages/nasp.asc"
        cat /tmp/nasp.asc | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/nasp.gpg >/dev/null
        sudo apt update
    elif [ -x "$(command -v dnf)" ]; then
        # CentOS/RHEL
        sudo rpm --import "$NASP_REPO_URL/packages/nasp.asc"
        sudo tee /etc/yum.repos.d/nasp.repo >/dev/null <<EOF
[nasp-repo]
name=NASP Repository
baseurl=$NASP_REPO_URL/packages/rpm
enabled=1
gpgcheck=1
EOF
        sudo dnf makecache
    else
        error "Unsupported package manager. Please add the NASP repository and key manually."
    fi
}

# Function to enable and start systemd unit
enable_and_start_unit() {
    log "Enabling and starting $1 systemd unit..."
    sudo systemctl enable "$1"
    sudo systemctl start "$1"
    sudo systemctl status "$1"
}

# Function to check if a kernel module is available
is_kernel_module_available() {
    find /lib/modules/$(uname -r) -type f -name '*.ko*' | grep -w "$1" &>/dev/null
}

# Function to load the "nasp" kernel module
load_nasp_module() {
    log "Loading nasp kernel module..."
    if is_kernel_module_available "tls"; then
        sudo modprobe nasp ktls_available=1
    else
        sudo modprobe nasp ktls_available=0
    fi
}

# Main script

# Add NASP repository and key
add_nasp_repo_and_key

# Install packages
for pkg in "${PACKAGES[@]}"; do
    if is_package_installed "$pkg"; then
        log "$pkg is already installed."
    else
        log "Installing $pkg..."
        install_package "$pkg"
        log "Installation of $pkg complete."
    fi
done

# Load nasp kernel module
load_nasp_module

# Enable and start systemd unit
enable_and_start_unit "nasp"

log "Nasp installation, repository setup, systemd unit start, and kernel module load script finished."
log "Please find and edit the configuration under /etc/nasp/."
