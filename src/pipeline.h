#ifndef SRC_PIPELINE_H_
#define SRC_PIPELINE_H_

#include <memory>

#include <vips/vips8>

#include "nan.h"
#include "common.h"

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
  int cropCalcLeft;
  int cropCalcTop;
  std::string kernel;
  std::string interpolator;
  bool centreSampling;
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
  bool normalise;
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
  int tiffQuality;
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
    cropCalcLeft(-1),
    cropCalcTop(-1),
    centreSampling(false),
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
    normalise(false),
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
    pngCompressionLevel(6),
    pngAdaptiveFiltering(true),
    webpQuality(80),
    tiffQuality(80),
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
    tileLayout(VIPS_FOREIGN_DZ_LAYOUT_DZ) {
      background[0] = 0.0;
      background[1] = 0.0;
      background[2] = 0.0;
      background[3] = 255.0;
    }
};

#endif  // SRC_PIPELINE_H_
