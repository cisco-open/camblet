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

package sd

import (
	"context"
	"fmt"
	"net"
	"net/netip"
	"strconv"
	"strings"
	"sync"

	"github.com/go-logr/logr"
	"gopkg.in/yaml.v2"

	"github.com/cisco-open/nasp/pkg/util"
)

type FilesLoader interface {
	Run(context.Context, EntryHandlerFunc) error
}

type filesLoader struct {
	fileContentLoader util.FileContentLoader
	logger            logr.Logger

	mu sync.Mutex
}

type EntryHandlerFunc func(Entries)

func NewFilesLoader(paths []string, logger logr.Logger) FilesLoader {
	l := logger.WithName("sdFileLoader")

	return &filesLoader{
		fileContentLoader: util.NewFileContentLoader(paths, l),
		logger:            l,

		mu: sync.Mutex{},
	}
}

func (r *filesLoader) Run(ctx context.Context, h EntryHandlerFunc) error {
	return r.fileContentLoader.Run(ctx, func(contents map[string][]byte) {
		loadedEntries := make(Entries, 0)

		for file, content := range contents {
			var rawEntries RawEntries
			if err := yaml.Unmarshal(content, &rawEntries); err != nil {
				r.logger.Error(err, "error during sd file parsing", "path", file)
				continue
			}

			for _, entry := range rawEntries {
				// skip invalid entries
				if len(entry.Tags) == 0 || len(entry.Addresses) == 0 {
					continue
				}
				for _, address := range entry.Addresses {
					addrs := resolveAddress(address)
					for _, addr := range addrs {
						loadedEntries[addressToString(addr)] = Entry{
							Tags: entry.Tags,
						}
					}
				}
			}
		}

		h(loadedEntries)
	})
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

	addrs := make([]netip.Addr, 0)
	if addr, err := netip.ParseAddr(host); err != nil {
		netips, err := net.LookupIP(host)
		if err != nil {
			return nil
		}
		for _, ip := range netips {
			if addr, ok := netip.AddrFromSlice(ip); ok {
				addrs = append(addrs, addr)
			}
		}
	} else {
		addrs = append(addrs, addr)
	}

	for _, addr := range addrs {
		addrporrs = append(addrporrs, netip.AddrPortFrom(addr, uint16(intport)))
	}

	return addrporrs
}
