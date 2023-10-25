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
	"context"
	"sync"

	"github.com/go-logr/logr"
	"gopkg.in/yaml.v2"

	"github.com/cisco-open/nasp/pkg/util"
)

type RulesLoader interface {
	Run(context.Context, RulesHandlerFunc) error
}

type ruleFilesLoader struct {
	fileContentLoader util.FileContentLoader
	logger            logr.Logger

	mu sync.Mutex
}

type RulesHandlerFunc func(Rules)

func NewRuleFilesLoader(paths []string, logger logr.Logger) RulesLoader {
	l := logger.WithName("ruleFileLoader")

	return &ruleFilesLoader{
		fileContentLoader: util.NewFileContentLoader(paths, l),
		logger:            l,

		mu: sync.Mutex{},
	}
}

func (r *ruleFilesLoader) Run(ctx context.Context, h RulesHandlerFunc) error {
	return r.fileContentLoader.Run(ctx, func(contents map[string][]byte) {
		var loadedRules Rules

		for file, content := range contents {
			var _rules Rules
			if err := yaml.Unmarshal(content, &_rules); err != nil {
				r.logger.Error(err, "error during rule file parsing", "path", file)
				continue
			}

			loadedRules = append(loadedRules, _rules...)
		}

		loadedRules.Organize()

		h(loadedRules)
	})
}
