Name:           nasp
Version:        0.4.0
Release:        1%{?dist}
Summary:        NASP is a network acceleration and security platform

License:        GPL-MIT Dual License
URL:            https://nasp.io

Requires:       nasp-agent
Requires:       nasp-kernel-module

BuildArch:      noarch

%description
This is a meta package for NASP, which includes nasp-agent and nasp-kernel-module.

%files
# Empty section, as this is a meta package

%changelog
* Thu Dec 07 2023 Nandor Kracser <nandork@cisco.com> - 0.1.0-1
- Initial build
