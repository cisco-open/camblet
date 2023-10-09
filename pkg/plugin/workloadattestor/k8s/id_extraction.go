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

package k8s

import (
	"regexp"
	"strings"

	"github.com/cisco-open/nasp/pkg/plugin/workloadattestor/docker"
)

var podUIDandContainerIDRegex = regexp.MustCompile(`^(([a-z0-9/.-]+)?([/-]pod)?([a-z0-9\-\_]{36}))?.*([a-z0-9]{64})([a-z0-9/.-]+)?$`)

func getPodUIDAndContainerIDFromCGroups(cgroups []docker.Cgroup) (string, string) {
	var containerID string
	for _, cgroup := range cgroups {
		matches := podUIDandContainerIDRegex.FindStringSubmatch(cgroup.CGroupPath)
		if len(matches) != 7 {
			continue
		}
		if matches[4] != "" && matches[5] != "" {
			return strings.ReplaceAll(matches[4], "_", "-"), matches[5]
		}
		if matches[5] != "" {
			containerID = matches[5]
		}
	}

	return "", containerID
}
