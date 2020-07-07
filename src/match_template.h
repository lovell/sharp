// Copyright 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020 Lovell Fuller and contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#ifndef SRC_MATCH_TEMPLATE_H_
#define SRC_MATCH_TEMPLATE_H_

#include <string>
#include <napi.h>

#include "./common.h"

struct MatchTemplateBaton {
  // Input
  sharp::InputDescriptor *input;
  sharp::InputDescriptor *referenceInput;

  // Output
  int min;
  int minX;
  int minY;
  int referenceSumSquares;
  double score;
  std::string err;

  MatchTemplateBaton():
    input(nullptr),
    referenceInput(nullptr),
    min(0),
    minX(0),
    minY(0),
    referenceSumSquares(0),
    score(0.0)
    {}
};

Napi::Value matchTemplate(const Napi::CallbackInfo& info);


#endif  // SRC_MATCH_TEMPLATE_H_
