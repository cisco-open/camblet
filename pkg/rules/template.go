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
	"bytes"
	"text/template"

	"github.com/go-logr/logr"
)

type RuleTemplateValues struct {
	TrustDomain string
}

type Templater interface {
	Execute([]byte) []byte
}

type templater struct {
	values RuleTemplateValues
	logger logr.Logger
}

func NewRuleTemplater(values RuleTemplateValues, logger logr.Logger) Templater {
	return &templater{
		values: values,
		logger: logger,
	}
}

func (t *templater) Execute(content []byte) []byte {
	tpl, err := template.New("content").Parse(string(content))
	if err != nil {
		t.logger.Error(err, "could not parse rule content for templating")

		return content
	}

	buff := new(bytes.Buffer)
	if err := tpl.Execute(buff, t.values); err != nil {
		t.logger.Error(err, "could not render templated rule content")

		return content
	}

	return buff.Bytes()
}