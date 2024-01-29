#!/bin/bash

set -euo pipefail

log() {
    echo -e "\e[34m[$(date)]\e[0m $1"
}

error() {
    echo -e "\e[31m[$(date)]\e[0m $1"
    exit 1
}

# Cambetl installation script
# This script installs the Camblet packages, adds the Camblet repository and key,
# enables and starts the systemd unit, and loads the "camblet" kernel module.

# Define the packages you want to install
PACKAGES=("camblet")

# URL of your Camblet repository
CAMBLET_REPO_URL="https://camblet.io"

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
        enable_epel="--enablerepo=epel"
        # Disable EPEL on Amazon Linux
        grep Amazon /etc/os-release &>/dev/null && enable_epel=""
        sudo dnf install -y kernel-devel-$(uname -r)
        sudo dnf install ${enable_epel} -y "$1"
    else
        error "Unsupported package manager. Please install packages manually."
    fi
}

# Function to add Camblet repository and key
add_camblet_repo_and_key() {
    log "Adding Camblet repository and key..."
    if [ -x "$(command -v apt)" ]; then
        # Debian/Ubuntu
        sudo apt update
        sudo apt install -y wget gnupg linux-headers-$(uname -r) dkms
        sudo sh -c "echo 'deb [signed-by=/etc/apt/trusted.gpg.d/camblet.gpg] $CAMBLET_REPO_URL/packages/deb stable main' > /etc/apt/sources.list.d/camblet.list"
        sudo wget -O /tmp/camblet.asc "$CAMBLET_REPO_URL/packages/camblet.asc"
        cat /tmp/camblet.asc | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/camblet.gpg >/dev/null
        sudo apt update
    elif [ -x "$(command -v dnf)" ]; then
        # CentOS/RHEL
        sudo rpm --import "$CAMBLET_REPO_URL/packages/camblet.asc"
        sudo tee /etc/yum.repos.d/camblet.repo >/dev/null <<EOF
[camblet-repo]
name=Camblet Repository
baseurl=$CAMBLET_REPO_URL/packages/rpm
enabled=1
gpgcheck=1
EOF
        sudo dnf makecache
    else
        error "Unsupported package manager. Please add the Camblet repository and key manually."
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

# Function to load the "camblet" kernel module
load_camblet_module() {
    local module_name="camblet"
    local config_file="/etc/modules-load.d/modules.conf"
    local parameters=("dyndbg==_")

    log "Loading camblet kernel module..."
    if is_kernel_module_available "tls"; then
        parameters+=("ktls_available=1")
    else
        log "TLS kernel module not available. Disabling ktls."
        parameters+=("ktls_available=0")
    fi

    sudo modprobe camblet "${parameters[@]}"

    # Check if the module loading configuration file already exists
    if [ -e "$config_file" ]; then
        echo "Configuration file '$config_file' already exists. Appending parameters."
        echo "$module_name" | sudo tee -a "$config_file"
    else
        echo "Creating new configuration file '$config_file' with parameters."
        echo "$module_name" | sudo tee "$config_file"
    fi
}

# Main script

# Add Camblet repository and key
add_camblet_repo_and_key

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

# Load camblet kernel module
load_camblet_module

# Enable and start systemd unit
enable_and_start_unit "camblet"

log "Camblet installation, repository setup, systemd unit start, and kernel module load script finished."
log "Please find and edit the configuration under /etc/camblet/."
