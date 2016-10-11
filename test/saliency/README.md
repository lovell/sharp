# Crop strategy accuracy

1. Download the [MSRA Salient Object Database](http://research.microsoft.com/en-us/um/people/jiansun/SalientObject/salient_object.htm) (101MB).
2. Extract each image and its median human-labelled salient region.
3. Generate a test report of percentage deviance of top and left edges for each crop strategy, plus a naive centre gravity crop as "control".

```sh
git clone https://github.com/lovell/sharp.git
cd sharp/test/saliency
./download.sh
node report.js
python -m SimpleHTTPServer
```

The test report will then be available at
http://localhost:8000/report.html
