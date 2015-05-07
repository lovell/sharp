#ifndef SRC_COMPOSITE_H_
#define SRC_COMPOSITE_H_


#ifdef __cplusplus
extern "C" {
#endif

int Composite(VipsObject *context, VipsImage *src, VipsImage *dst, VipsImage **out);
int Premultiply(VipsObject *context, VipsImage *image, VipsImage **out);
int Unpremultiply(VipsObject *context, VipsImage *image, VipsImage **out);

#ifdef __cplusplus
}
#endif

#endif  // SRC_COMPOSITE_H_
