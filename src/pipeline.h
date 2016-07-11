#ifndef SRC_PIPELINE_H_
#define SRC_PIPELINE_H_

#include <memory>

#include <vips/vips8>

#include "nan.h"

NAN_METHOD(pipeline);

enum class Canvas {
  CROP,
  EMBED,
  MAX,
  MIN,
  IGNORE_ASPECT
};

struct PipelineBaton {
  std::string fileIn;
  char *bufferIn;
  size_t bufferInLength;
  std::string iccProfilePath;
  int limitInputPixels;
  int density;
  int rawWidth;
  int rawHeight;
  int rawChannels;
  std::string formatOut;
  std::string fileOut;
  void *bufferOut;
  size_t bufferOutLength;
  std::string overlayFileIn;
  char *overlayBufferIn;
  size_t overlayBufferInLength;
  int overlayGravity;
  int overlayXOffset;
  int overlayYOffset;
  bool overlayTile;
  bool overlayCutout;
  std::string booleanFileIn;
  char *booleanBufferIn;
  size_t booleanBufferInLength;
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
  std::string kernel;
  std::string interpolator;
  double background[4];
  bool flatten;
  bool negate;
  double blurSigma;
  double sharpenSigma;
  double sharpenFlat;
  double sharpenJagged;
  int threshold;
  bool thresholdGrayscale;
  int trimTolerance;
  double gamma;
  bool greyscale;
  bool normalize;
  int angle;
  bool rotateBeforePreExtract;
  bool flip;
  bool flop;
  int extendTop;
  int extendBottom;
  int extendLeft;
  int extendRight;
  bool progressive;
  bool withoutEnlargement;
  VipsAccess accessMethod;
  int quality;
  int compressionLevel;
  bool withoutAdaptiveFiltering;
  bool withoutChromaSubsampling;
  bool trellisQuantisation;
  bool overshootDeringing;
  bool optimiseScans;
  std::string err;
  bool withMetadata;
  int withMetadataOrientation;
  std::unique_ptr<double[]> convKernel;
  int convKernelWidth;
  int convKernelHeight;
  double convKernelScale;
  double convKernelOffset;
  VipsOperationBoolean bandBoolOp;
  VipsOperationBoolean booleanOp;
  int extractChannel;
  int tileSize;
  int tileOverlap;
  VipsForeignDzContainer tileContainer;
  VipsForeignDzLayout tileLayout;

  PipelineBaton():
    bufferInLength(0),
    limitInputPixels(0),
    density(72),
    rawWidth(0),
    rawHeight(0),
    rawChannels(0),
    formatOut(""),
    fileOut(""),
    bufferOutLength(0),
    overlayBufferInLength(0),
    overlayGravity(0),
    overlayXOffset(-1),
    overlayYOffset(-1),
    overlayTile(false),
    overlayCutout(false),
    booleanBufferInLength(0),
    topOffsetPre(-1),
    topOffsetPost(-1),
    channels(0),
    canvas(Canvas::CROP),
    crop(0),
    flatten(false),
    negate(false),
    blurSigma(0.0),
    sharpenSigma(0.0),
    sharpenFlat(1.0),
    sharpenJagged(2.0),
    threshold(0),
    thresholdGrayscale(true),
    trimTolerance(0),
    gamma(0.0),
    greyscale(false),
    normalize(false),
    angle(0),
    flip(false),
    flop(false),
    extendTop(0),
    extendBottom(0),
    extendLeft(0),
    extendRight(0),
    progressive(false),
    withoutEnlargement(false),
    quality(80),
    compressionLevel(6),
    withoutAdaptiveFiltering(false),
    withoutChromaSubsampling(false),
    trellisQuantisation(false),
    overshootDeringing(false),
    optimiseScans(false),
    withMetadata(false),
    withMetadataOrientation(-1),
    convKernelWidth(0),
    convKernelHeight(0),
    convKernelScale(0.0),
    convKernelOffset(0.0),
    bandBoolOp(VIPS_OPERATION_BOOLEAN_LAST),
    booleanOp(VIPS_OPERATION_BOOLEAN_LAST),
    extractChannel(-1),
    tileSize(256),
    tileOverlap(0),
    tileContainer(VIPS_FOREIGN_DZ_CONTAINER_FS),
    tileLayout(VIPS_FOREIGN_DZ_LAYOUT_DZ) {
      background[0] = 0.0;
      background[1] = 0.0;
      background[2] = 0.0;
      background[3] = 255.0;
    }
};

#endif  // SRC_PIPELINE_H_
