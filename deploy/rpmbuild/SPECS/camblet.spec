Name:           camblet
Version:        0.8.0
Release:        1%{?dist}
Summary:        Camblet is a network acceleration and security platform

License:        GPL-MIT Dual License
URL:            https://camblet.io

Requires:       camblet-agent
Requires:       camblet-driver

BuildArch:      noarch

%description
This is a meta package for Camblet, which includes camblet-agent and camblet-driver.

%files
# Empty section, as this is a meta package

%changelog
* Thu Dec 07 2023 Nandor Kracser <nandork@cisco.com> - 0.1.0-1
- Initial build
