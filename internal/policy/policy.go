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

package policy

import (
	"context"
	"reflect"
	"sort"

	"github.com/cisco-open/nasp/api/v1/core"
)

type RawPolicy = core.Policy
type RawPolicies []*RawPolicy

type HandlerFunc func(Policies)

type Loader interface {
	Run(context.Context, HandlerFunc) error
}

type Policies []*Policy

type Selectors []map[string]bool

type Policy struct {
	Position int    `json:"position"`
	ID       string `json:"id,omitempty"`

	Selectors   Selectors                `json:"selectors,omitempty"`
	Certificate *core.Policy_Certificate `json:"certificate,omitempty"`
	Connection  *core.Policy_Connection  `json:"connection,omitempty"`
	Egress      Policies                 `json:"egress,omitempty"`
}

func (p Policies) Organize() {
	sort.SliceStable(p, func(i, j int) bool {
		for _, sel := range p[i].Selectors {
			for _, sel2 := range p[j].Selectors {
				if reflect.DeepEqual(sel, sel2) {
					continue
				}

				if IsMapSubset(sel, sel2) {
					return true
				}
			}
		}

		return false
	})

	for k, policy := range p {
		policy := policy

		policy.Position = k
		policy.Egress.Organize()
	}
}

func IsMapSubset[K, V comparable](m, sub map[K]V) bool {
	if len(sub) > len(m) {
		return false
	}

	for k, vsub := range sub {
		if vm, found := m[k]; !found || vm != vsub {
			return false
		}
	}

	return true
}
