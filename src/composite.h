#ifndef SRC_COMPOSITE_H_
#define SRC_COMPOSITE_H_


#ifdef __cplusplus
extern "C" {
#endif
/*
  Composite images `src` and `dst`.
*/
int Composite(VipsObject *context, VipsImage *src, VipsImage *dst, VipsImage **out);

#ifdef __cplusplus
}
#endif

#endif  // SRC_COMPOSITE_H_
