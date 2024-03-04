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
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"google.golang.org/protobuf/types/known/structpb"
)

func ConvertPolicy(policy *RawPolicy) *Policy {
	iPolicy := &Policy{
		ID:          getPolicyID(policy),
		Certificate: policy.GetCertificate(),
		Connection:  policy.GetConnection(),
		Egress:      ConvertPolicies(policy.Egress),
	}

	for _, sel := range policy.GetSelectors() {
		iPolicy.Selectors = append(iPolicy.Selectors, convertSelectorsToRawSelectors(sel)...)
	}

	return iPolicy
}

func ConvertPolicies(policies []*RawPolicy) Policies {
	iPolicies := Policies{}
	for _, policy := range policies {
		iPolicies = append(iPolicies, ConvertPolicy(policy))
	}

	return iPolicies
}

func convertSelectorsToRawSelectors(selectors *structpb.Struct) Selectors {
	return convertStringArraysSelectorsToMap(makeArrayPermutations(flattenAndStringifySelectors(selectors)))
}

func getPolicyID(policy *RawPolicy) string {
	y, err := json.Marshal(policy.Certificate)
	if err != nil {
		return ""
	}

	return uuid.NewSHA1(uuid.Nil, y).String()
}

func getValueForKind(value *structpb.Value) []string {
	values := []string{}

	switch val := value.Kind.(type) {
	case *structpb.Value_NumberValue:
		values = append(values, fmt.Sprintf("%0.0f", val.NumberValue))
	case *structpb.Value_StringValue:
		values = append(values, val.StringValue)
	case *structpb.Value_ListValue:
		for _, v := range val.ListValue.GetValues() {
			values = append(values, getValueForKind(v)...)
		}
	}

	return values
}

func flattenAndStringifySelectors(selectors *structpb.Struct) [][]string {
	results := [][]string{}

	for k, v := range selectors.Fields {
		m := make([]string, 0)

		values := getValueForKind(v)
		for _, val := range values {
			m = append(m, fmt.Sprintf("%s=%s", k, val))
		}

		if len(m) > 0 {
			results = append(results, m)
		}
	}

	return results
}

func makeArrayPermutations(arrays [][]string) [][]string {
	n := len(arrays)
	rest := make([][]string, 0)
	indicies := make([]int, n)

	for i := 0; i < n; i++ {
		indicies[i] = 0
	}

	for {
		r := make([]string, 0)
		for i := 0; i < n; i++ {
			r = append(r, arrays[i][indicies[i]])

		}
		rest = append(rest, r)

		next := n - 1
		for next >= 0 && (indicies[next]+1 >= len(arrays[next])) {
			next--
		}

		if next < 0 {
			break
		}

		indicies[next]++

		for i := next + 1; i < n; i++ {
			indicies[i] = 0
		}
	}

	return rest
}

func convertStringArraysSelectorsToMap(arrays [][]string) []map[string]bool {
	result := []map[string]bool{}

	for _, array := range arrays {
		m := map[string]bool{}

		for _, value := range array {
			m[value] = true
		}

		result = append(result, m)
	}

	return result
}
