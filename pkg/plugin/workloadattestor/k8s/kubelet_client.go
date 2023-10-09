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
