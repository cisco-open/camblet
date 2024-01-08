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
	"encoding/json"

	"github.com/go-logr/logr"
	"google.golang.org/protobuf/encoding/protojson"
	"sigs.k8s.io/yaml"

	"github.com/cisco-open/nasp/pkg/util"
)

type ProtoValidatorFunc func(*RawPolicy) error

type fileLoader struct {
	fileContentLoader util.FileContentLoader
	logger            logr.Logger
	templateFunc      TemplateFunc
	validatorFunc     ProtoValidatorFunc
}

type TemplateFunc func([]byte) []byte

type FileLoaderOption func(*fileLoader)

func FileLoaderWithTemplateFunc(f TemplateFunc) FileLoaderOption {
	return func(l *fileLoader) {
		l.templateFunc = f
	}
}

func FileLoaderWithProtoValidatorFunc(fn ProtoValidatorFunc) FileLoaderOption {
	return func(l *fileLoader) {
		l.validatorFunc = fn
	}
}

func NewFileLoader(paths []string, logger logr.Logger, opts ...FileLoaderOption) Loader {
	l := logger.WithName("fileLoader")

	pfl := &fileLoader{
		fileContentLoader: util.NewFileContentLoader(paths, l),
		logger:            l,
	}

	for _, f := range opts {
		f(pfl)
	}

	return pfl
}

func (r *fileLoader) Run(ctx context.Context, h HandlerFunc) error {
	return r.fileContentLoader.Run(ctx, func(contents map[string][]byte) {
		var policies Policies

		for file, content := range contents {
			if r.templateFunc != nil {
				content = r.templateFunc(content)
			}

			if ps, err := r.unmarshal(content); err != nil {
				r.logger.Error(err, "error during parsing policy file ", "path", file)
				continue
			} else {
				policies = append(policies, ps...)
			}
		}

		policies.Organize()

		h(policies)
	})
}

func (r *fileLoader) unmarshal(content []byte) (Policies, error) {
	var raw []any
	if err := yaml.Unmarshal(content, &raw); err != nil {
		return nil, err
	}

	policies := RawPolicies{}
	for _, item := range raw {
		policyJSON, err := json.Marshal(item)
		if err != nil {
			r.logger.Error(err, "could not marshal policy to json")
			continue
		}

		var policy RawPolicy
		if err := protojson.Unmarshal(policyJSON, &policy); err != nil {
			r.logger.Error(err, "could not unmarshal json policy to proto")
			continue
		}

		if r.validatorFunc != nil {
			if err := r.validatorFunc(&policy); err != nil {
				r.logger.Error(err, "invalid policy")
				continue
			}
		}

		policies = append(policies, &policy)
	}

	return ConvertPolicies(policies), nil
}
