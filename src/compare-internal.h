#ifndef SRC_COMPARE_INTERNAL_H_
#define SRC_COMPARE_INTERNAL_H_


#ifdef __cplusplus
extern "C" {
#endif

int Compare(VipsObject *context, VipsImage *actual, VipsImage *expected, double *out);;

#ifdef __cplusplus
}
#endif

#endif  // SRC_COMPARE_INTERNAL_H_
