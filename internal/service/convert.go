/*
 * The MIT License (MIT)
 * Copyright (c) 2023 Cisco and/or its affiliates. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
 * TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

package service

import (
	"context"
	"fmt"
	"net"
	"net/netip"
	"strconv"
	"strings"

	"github.com/cisco-open/camblet/api/v1/core"
)

func ConvertEntries(rawServices RawServices, withTags map[string]struct{}) Services {
	entries := Services{}

	filterAddressByTag := func(address *core.Service_Address) bool {
		if len(address.GetTags()) == 0 || len(withTags) == 0 {
			return true
		}

		var found bool
		for _, tag := range address.GetTags() {
			if _, ok := withTags[tag]; ok {
				found = ok
			}
		}

		return found
	}

	for _, svc := range rawServices {
		// skip invalid entries
		if len(svc.Labels) == 0 || len(svc.Addresses) == 0 {
			continue
		}
		for _, address := range svc.Addresses {
			if !filterAddressByTag(address) {
				continue
			}
			addrs := resolveAddress(address.GetAddress() + ":" + strconv.Itoa(int(address.GetPort())))
			for _, addr := range addrs {
				MergeEntries(entries, Services{
					addressToString(addr): &Service{
						Labels: flattenLabels(svc.Labels),
					},
				})
			}
		}
	}

	return entries
}

func MergeEntries(l, r Services) Services {
	for k, e := range r {
		if _, ok := l[k]; !ok {
			l[k] = e
		} else {
			l[k].Labels = append(l[k].Labels, e.Labels...)
		}
	}

	return l
}

func flattenLabels(labels map[string]string) []string {
	flattened := make([]string, 0)

	for k, v := range labels {
		flattened = append(flattened, k+"="+v)
	}

	return flattened
}

func addressToString(addr netip.AddrPort) string {
	if addr.Port() == 0 {
		return addr.Addr().StringExpanded()
	}

	return fmt.Sprintf("%s:%d", addr.Addr().StringExpanded(), addr.Port())
}

func resolveAddress(address string) []netip.AddrPort {
	hasPort := strings.ContainsRune(address, ':')
	addrporrs := make([]netip.AddrPort, 0)

	var host, port string
	var err error

	if hasPort {
		host, port, err = net.SplitHostPort(address)
		if err != nil {
			return nil
		}
	} else {
		host = address
	}

	var intport int
	if port != "" {
		intport, err = strconv.Atoi(port)
		if err != nil {
			return nil
		}
	}

	// there are some issues at some systems retrieving ipv4 address when there are ipv6 addresses as well
	// for that reason there is a separate direct ipv4 lookup
	// TODO @wayne - more investigation needed
	addrs := make(map[netip.Addr]struct{})
	if addr, err := netip.ParseAddr(host); err != nil {
		netips, err := net.DefaultResolver.LookupIP(context.Background(), "ip4", host)
		if err == nil {
			for _, ip := range netips {
				if addr, ok := netip.AddrFromSlice(ip.To4()); ok {
					addrs[addr] = struct{}{}
				}
			}
		}
		netips, err = net.DefaultResolver.LookupIP(context.Background(), "ip", host)
		if err == nil {
			for _, ip := range netips {
				if addr, ok := netip.AddrFromSlice(ip); ok {
					// if the address is ipv4 in ipv6 format and it is a loopback address, convert it to ipv6 loopback
					if addr.Is4In6() && addr.IsLoopback() {
						addr = netip.IPv6Loopback()
					}
					addrs[addr] = struct{}{}
				}
			}
		}
	} else {
		addrs[addr] = struct{}{}
	}

	for addr := range addrs {
		addrporrs = append(addrporrs, netip.AddrPortFrom(addr, uint16(intport)))
	}

	return addrporrs
}
