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

package docker

import (
	"bufio"
	"errors"
	"os"
	"strings"

	"github.com/cisco-open/nasp/pkg/plugin/workloadattestor/linux"
)

type Cgroup struct {
	HierarchyID    string
	ControllerList string
	CGroupPath     string
}

func GetCgroups(pid int32) ([]Cgroup, error) {
	path := linux.GetProcPath(pid, "cgroup")

	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var cgroups []Cgroup
	scanner := bufio.NewScanner(file)

	for scanner.Scan() {
		token := scanner.Text()
		substrings := strings.SplitN(token, ":", 3)
		if len(substrings) < 3 {
			return nil, errors.New("malformed cgroup entry")
		}
		cgroups = append(cgroups, Cgroup{
			HierarchyID:    substrings[0],
			ControllerList: substrings[1],
			CGroupPath:     substrings[2],
		})
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	return cgroups, nil
}
