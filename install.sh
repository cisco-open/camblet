#!/bin/bash

# NASP installation script

# Define the packages you want to install
PACKAGES=("nasp")

# URL of your NASP repository
NASP_REPO_URL="https://nasp.rocks"

# Function to check if a package is installed
is_package_installed() {
    dpkg -l "$1" &> /dev/null || rpm -q "$1" &> /dev/null
}

# Function to install a package
install_package() {
    if [ -x "$(command -v apt)" ]; then
        # Debian/Ubuntu
        sudo apt update
        sudo apt install -y "$1"
    elif [ -x "$(command -v yum)" ]; then
        # CentOS/RHEL
        sudo yum install -y "$1"
    else
        echo "Unsupported package manager. Please install packages manually."
        exit 1
    fi
}

# Function to add NASP repository and key
add_nasp_repo_and_key() {
    if [ -x "$(command -v apt)" ]; then
        # Debian/Ubuntu
        sudo sh -c "echo 'deb $NASP_REPO_URL/packages/deb /' > /etc/apt/sources.list.d/nasp.list"
        sudo wget -O /etc/apt/trusted.gpg.d/nasp.gpg "$NASP_REPO_URL/packages/nasp.gpg"
        sudo apt update
    elif [ -x "$(command -v yum)" ]; then
        # CentOS/RHEL
        sudo rpm --import "$NASP_REPO_URL/nasp.gpg"
        sudo yum-config-manager --add-repo="$NASP_REPO_URL/packages/rpm"
    else
        echo "Unsupported package manager. Please add the NASP repository and key manually."
        exit 1
    fi
}

# Function to enable and start systemd unit
enable_and_start_unit() {
    sudo systemctl enable "$1"
    sudo systemctl start "$1"
    sudo systemctl status "$1"
}

# Function to check if a kernel module is available
is_kernel_module_available() {
    find /lib/modules/$(uname -r) -type f -name '*.ko*' | grep -w "$1" &> /dev/null
}

# Function to load the "nasp" kernel module
load_nasp_module() {
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
        echo "$pkg is already installed."
    else
        echo "Installing $pkg..."
        install_package "$pkg"
        echo "Installation of $pkg complete."
    fi
done

# Load nasp kernel module
load_nasp_module

# Enable and start systemd unit
enable_and_start_unit "nasp"

echo "Nasp installation, repository setup, systemd unit start, and kernel module load script finished."
echo "Please find and edit the configuration under /etc/nasp/."
