// Copyright 2013, 2014, 2015, 2016, 2017 Lovell Fuller and contributors.
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

#ifndef SRC_PIPELINE_H_
#define SRC_PIPELINE_H_

#include <memory>
#include <string>
#include <vector>

#include <nan.h>
#include <vips/vips8>

#include "./common.h"

NAN_METHOD(pipeline);

enum class Canvas {
  CROP,
  EMBED,
  MAX,
  MIN,
  IGNORE_ASPECT
};

struct PipelineBaton {
  sharp::InputDescriptor *input;
  std::string iccProfilePath;
  int limitInputPixels;
  std::string formatOut;
  std::string fileOut;
  void *bufferOut;
  size_t bufferOutLength;
  sharp::InputDescriptor *overlay;
  int overlayGravity;
  int overlayXOffset;
  int overlayYOffset;
  bool overlayTile;
  bool overlayCutout;
  std::vector<sharp::InputDescriptor *> joinChannelIn;
  int topOffsetPre;
  int leftOffsetPre;
  int widthPre;
  int heightPre;
  int topOffsetPost;
  int leftOffsetPost;
  int widthPost;
  int heightPost;
  int width;
  int height;
  int channels;
  Canvas canvas;
  int crop;
  int embed;
  bool hasCropOffset;
  int cropOffsetLeft;
  int cropOffsetTop;
  bool premultiplied;
  std::string kernel;
  bool fastShrinkOnLoad;
  double background[4];
  bool flatten;
  bool negate;
  double blurSigma;
  int medianSize;
  double sharpenSigma;
  double sharpenFlat;
  double sharpenJagged;
  int threshold;
  bool thresholdGrayscale;
  int trimTolerance;
  double linearA;
  double linearB;
  double gamma;
  bool greyscale;
  bool normalise;
  bool useExifOrientation;
  int angle;
  bool rotateBeforePreExtract;
  bool flip;
  bool flop;
  int extendTop;
  int extendBottom;
  int extendLeft;
  int extendRight;
  bool withoutEnlargement;
  VipsAccess accessMethod;
  int jpegQuality;
  bool jpegProgressive;
  std::string jpegChromaSubsampling;
  bool jpegTrellisQuantisation;
  bool jpegOvershootDeringing;
  bool jpegOptimiseScans;
  bool pngProgressive;
  int pngCompressionLevel;
  bool pngAdaptiveFiltering;
  int webpQuality;
  int webpAlphaQuality;
  bool webpNearLossless;
  bool webpLossless;
  int tiffQuality;
  VipsForeignTiffCompression tiffCompression;
  VipsForeignTiffPredictor tiffPredictor;
  bool tiffSquash;
  double tiffXres;
  double tiffYres;
  std::string err;
  bool withMetadata;
  int withMetadataOrientation;
  std::unique_ptr<double[]> convKernel;
  int convKernelWidth;
  int convKernelHeight;
  double convKernelScale;
  double convKernelOffset;
  sharp::InputDescriptor *boolean;
  VipsOperationBoolean booleanOp;
  VipsOperationBoolean bandBoolOp;
  int extractChannel;
  VipsInterpretation colourspace;
  int tileSize;
  int tileOverlap;
  VipsForeignDzContainer tileContainer;
  VipsForeignDzLayout tileLayout;
  std::string tileFormat;
  int tileAngle;

  PipelineBaton():
    input(nullptr),
    limitInputPixels(0),
    bufferOutLength(0),
    overlay(nullptr),
    overlayGravity(0),
    overlayXOffset(-1),
    overlayYOffset(-1),
    overlayTile(false),
    overlayCutout(false),
    topOffsetPre(-1),
    topOffsetPost(-1),
    channels(0),
    canvas(Canvas::CROP),
    crop(0),
    embed(0),
    hasCropOffset(false),
    cropOffsetLeft(0),
    cropOffsetTop(0),
    premultiplied(false),
    flatten(false),
    negate(false),
    blurSigma(0.0),
    medianSize(0),
    sharpenSigma(0.0),
    sharpenFlat(1.0),
    sharpenJagged(2.0),
    threshold(0),
    thresholdGrayscale(true),
    trimTolerance(0),
    linearA(1.0),
    linearB(0.0),
    gamma(0.0),
    greyscale(false),
    normalise(false),
    useExifOrientation(false),
    angle(0),
    flip(false),
    flop(false),
    extendTop(0),
    extendBottom(0),
    extendLeft(0),
    extendRight(0),
    withoutEnlargement(false),
    jpegQuality(80),
    jpegProgressive(false),
    jpegChromaSubsampling("4:2:0"),
    jpegTrellisQuantisation(false),
    jpegOvershootDeringing(false),
    jpegOptimiseScans(false),
    pngProgressive(false),
    pngCompressionLevel(9),
    pngAdaptiveFiltering(false),
    webpQuality(80),
    tiffQuality(80),
    tiffCompression(VIPS_FOREIGN_TIFF_COMPRESSION_JPEG),
    tiffPredictor(VIPS_FOREIGN_TIFF_PREDICTOR_HORIZONTAL),
    tiffSquash(false),
    tiffXres(1.0),
    tiffYres(1.0),
    withMetadata(false),
    withMetadataOrientation(-1),
    convKernelWidth(0),
    convKernelHeight(0),
    convKernelScale(0.0),
    convKernelOffset(0.0),
    boolean(nullptr),
    booleanOp(VIPS_OPERATION_BOOLEAN_LAST),
    bandBoolOp(VIPS_OPERATION_BOOLEAN_LAST),
    extractChannel(-1),
    colourspace(VIPS_INTERPRETATION_LAST),
    tileSize(256),
    tileOverlap(0),
    tileContainer(VIPS_FOREIGN_DZ_CONTAINER_FS),
    tileLayout(VIPS_FOREIGN_DZ_LAYOUT_DZ),
    tileAngle(0){
      background[0] = 0.0;
      background[1] = 0.0;
      background[2] = 0.0;
      background[3] = 255.0;
    }
};

#endif  // SRC_PIPELINE_H_
