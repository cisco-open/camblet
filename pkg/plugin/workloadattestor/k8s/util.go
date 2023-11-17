/*
 * Copyright The SPIFFE Project & Scytale, Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * 	http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package k8s

import (
	"encoding/json"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	corev1 "k8s.io/api/core/v1"
)

func getPods(j []byte) ([]corev1.Pod, error) {
	podList := new(corev1.PodList)
	if err := json.Unmarshal(j, &podList); err != nil {
		return nil, status.Errorf(codes.Internal, "unable to decode pod info from kubelet response: %v", err)
	}

	return podList.Items, nil
}
