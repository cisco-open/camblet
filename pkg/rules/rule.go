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

package rules

import (
	"reflect"
	"sort"

	"github.com/google/uuid"
	"gopkg.in/yaml.v3"
)

type Rules []*Rule

type Selectors map[string]any

type RawSelectors []map[string]bool

type Properties struct {
	MTLS       *bool    `yaml:"mtls,omitempty" json:"mtls,omitempty"`
	WorkloadID string   `yaml:"workloadID,omitempty" json:"workloadID,omitempty"`
	DNS        []string `yaml:"dns,omitempty" json:"dns,omitempty"`
}

type Policy struct {
	SpiffeID []string `yaml:"spiffeID,omitempty" json:"spiffeID,omitempty"`
}

type Rule struct {
	NR           int          `yaml:"nr,omitempty" json:"nr"`
	ID           string       `yaml:"id,omitempty" json:"id,omitempty"`
	Selectors    []Selectors  `yaml:"selectors,omitempty" json:"-"`
	RawSelectors RawSelectors `yaml:"rawSelectors,omitempty" json:"selectors,omitempty"`
	Properties   Properties   `yaml:"properties,omitempty" json:"properties,omitempty"`
	Policy       Policy       `yaml:"policy,omitempty" json:"policy,omitempty"`
	Egress       Rules        `yaml:"egress,omitempty" json:"egress,omitempty"`
}

func (r Rules) Organize() error {
	sort.SliceStable(r, func(i, j int) bool {
		for _, sel := range r[i].RawSelectors {
			for _, sel2 := range r[j].RawSelectors {
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

	for k, rule := range r {
		rule.NR = k
	}

	for _, rule := range r {
		if err := rule.Egress.Organize(); err != nil {
			return err
		}
	}

	return nil
}

func (r *Rule) UnmarshalYAML(unmarshal func(interface{}) error) error {
	type shadowRule Rule

	var rule shadowRule
	err := unmarshal(&rule)
	if err != nil {
		return err
	}

	r.ID = Rule(rule).getID()
	r.Policy = rule.Policy
	r.Properties = rule.Properties
	r.Selectors = rule.Selectors
	r.Egress = rule.Egress

	for _, sel := range rule.Selectors {
		r.RawSelectors = append(r.RawSelectors, ConvertSelectorsToRawSelectors(sel)...)
	}

	return nil
}

func (r Rule) getID() string {
	y, err := yaml.Marshal(r.Properties)
	if err != nil {
		return ""
	}

	return uuid.NewSHA1(uuid.Nil, y).String()
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
