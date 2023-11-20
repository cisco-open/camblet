// Copyright The SPIFFE Project & Scytale, Inc
// Copyright (c) 2023 Cisco and its affiliates. All rights reserved.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

// 	http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package k8s

import (
	"io"
	"net/http"
	"net/url"

	"emperror.dev/errors"
)

type kubeletClient struct {
	Transport *http.Transport
	URL       url.URL
	Token     string
}

func (c *kubeletClient) GetPodList() ([]byte, error) {
	url := c.URL
	url.Path = "/pods"

	req, err := http.NewRequest("GET", url.String(), nil)
	if err != nil {
		return nil, errors.WrapIf(err, "could not create request")
	}

	if c.Token != "" {
		req.Header.Set("Authorization", "Bearer "+c.Token)
	}

	client := &http.Client{
		Transport: c.Transport,
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, errors.WrapIf(err, "could not perform request")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.Errorf("invalid response: %s", resp.Status)
	}

	out, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, errors.WrapIf(err, "could not read response")
	}

	return out, nil
}
