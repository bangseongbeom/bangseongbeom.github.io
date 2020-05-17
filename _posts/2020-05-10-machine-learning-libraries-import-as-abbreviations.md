---
title: 기계 학습 라이브러리들의 'import as' 약칭
category: machine-learning
---

`numpy`를 `np`로 줄여쓰는 것을 아시나요? 기계 학습과 관련된 파이썬 라이브러리들의 `import as` 약칭을 정리했습니다.

---

대부분의 파이썬 라이브러리에서는 `import as`를 사용하지 않습니다. `from import`를 통해 특정 함수나 클래스를 불러오는 경우가 대부분이며, 모듈 이름이 짧거나 명확성을 더하고 싶다면 `import`를 통해 직접 모듈을 불러옵니다. 각종 문서나 예시를 읽어봐도 `import as`를 쓰는 경우는 드뭅니다.

이와 달리 수학이나 통계, 기계 학습과 관련된 라이브러리들은 문서나 예시에서 관습적으로 `import as`를 사용하는 것을 확인할 수 있습니다. 아예 [넘파이]\(NumPy)는 공식 문서에서 `import as`를 어떻게 할 것인지 대해 직접 언급합니다[^import-conventions-throughout-numpy]. 이와 관련된 논의 또한 오래 전부터 존재해왔습니다[^digest-vol-19-issue-44].

[넘파이]: https://numpy.org/

[^import-conventions-throughout-numpy]: [A Guide to NumPy/SciPy Documentation - NumPy](https://numpy.org/doc/stable/docs/howto_document.html#import-conventions)

    > The following import conventions are used throughout the NumPy source and documentation:
    >
    > ```py
    > import numpy as np
    > import matplotlib as mpl
    > import matplotlib.pyplot as plt
    > ```

[^digest-vol-19-issue-44]: [Re: Numpy-discussion Digest, Vol 19, Issue 44](http://numpy-discussion.10968.n7.nabble.com/Re-Numpy-discussion-Digest-Vol-19-Issue-44-tt10095.html): 2008년 메일링 리스트에서 진행된 `import as` 표준화 논의

`import as`를 어떻게 할 것인지는 전적으로 코드 작성자의 선택입니다. 하지만 관습적으로 쓰이는 약칭을 사용한다면, 다른 사람이 나의 코드를 볼 때 내 코드의 `import`가 어떻게 되어있는지 굳이 확인해보지 않아도 된다는 장점이 있습니다. 기계 학습 관련 라이브러리 중 하나인 [판다스]\(pandas)는 문서의 모든 예시 코드에서 `import pandas as pd` 코드가 삽입되어 있다고 가정합니다[^code-assumed-pandas]. 때문에 `pd`가 무엇의 약칭인지 일일이 확인할 필요가 없습니다.

[^code-assumed-pandas]: [pandas docstring guide - pandas](https://pandas.pydata.org/docs/development/contributing_docstring.html#conventions-for-the-examples)

    > Code in examples is assumed to always start with these two lines which are not shown:
    >
    > ```py
    > import numpy as np
    > import pandas as pd
    > ```

## 넘파이

[넘파이]의 경우,  공식 문서와 소스 코드에서 `numpy` 모듈을 `np`로 줄여쓸 것이라 **명시적으로** 언급합니다.

[A Guide to NumPy/SciPy Documentation - NumPy](https://numpy.org/doc/stable/docs/howto_document.html#import-conventions)

> The following import conventions are used throughout the NumPy source and documentation:
>
> ```py
> import numpy as np
> ```

## 맷플롯립

[넘파이] 공식 문서와 소스 코드에서는 [맷플롯립]\(Matplotlib)의 `matplotlib` 모듈을 `mpl`, `matplotlib.pyplot` 모듈을 `plt`으로 줄여쓸 것이라 **명시적으로** 언급합니다.

[맷플롯립]: https://matplotlib.org/

[A Guide to NumPy/SciPy Documentation - NumPy](https://numpy.org/doc/stable/docs/howto_document.html#import-conventions)

> The following import conventions are used throughout the NumPy source and documentation:
>
> ```py
> import matplotlib as mpl
> import matplotlib.pyplot as plt
> ```

[맷플롯립]의 다른 하위 모듈에 대한 약칭에 대해서는 직접 언급하고 있지 않습니다. 공식 문서를 살펴보면 모듈 자체의 이름을 사용하거나, 아니면 모듈에서 사용할 함수나 클래스를 하나씩 `from import`로 가져옵니다.

[How-to - Matplotlib](https://matplotlib.org/faq/howto_faq.html)

> ```py
> import matplotlib.mlab as mlab
> import matplotlib.ticker as ticker
> ```
>
> ...
>
> ```py
> from matplotlib.backends.backend_pdf import PdfPages
> ```
>
> ...
>
> ```py
> from matplotlib.figure import Figure
> ```

## 사이파이

[사이파이]\(SciPy)의 경우 `scipy` 모듈에 대해 약칭을 사용하지 않을 것을 **명시적으로** 권고합니다[^do-not-abbreviate-scipy]. 하위 모듈에 대해 각각 `from import`를 사용합니다.

[사이파이]: https://scipy.org/

[^do-not-abbreviate-scipy]: [A Guide to NumPy/SciPy Documentation - NumPy](https://numpy.org/doc/stable/docs/howto_document.html#import-conventions)

    > Do not abbreviate scipy. There is no motivating use case to abbreviate it in the real world, so we avoid it in the documentation to avoid confusion.

[Introduction - SciPy](https://docs.scipy.org/doc/scipy/reference/tutorial/general.html#scipy-organization)

> SciPy sub-packages need to be imported separately, for example:
>
> ```py
> >>> from scipy import linalg, optimize
> ```

`scipy.io` 모듈은 파이썬 내장 패키지인 `io`와 충돌하므로 `import scipy.io as spio`처럼 약칭을 사용합니다.

[SciPy API - SciPy](https://docs.scipy.org/doc/scipy/reference/api.html#guidelines-for-importing-functions-from-scipy)

> This form of importing submodules is preferred for all submodules except scipy.io (because io is also the name of a module in the Python stdlib):
>
> ```py
> from scipy import interpolate
> from scipy import integrate
> import scipy.io as spio
> ```

`scipy.sparse.linalg` 모듈같이 한 층 더 깊이 존재하는 모듈이라면 `from scipy.sparse import linalg`처럼 합니다.

[SciPy API - SciPy](https://docs.scipy.org/doc/scipy/reference/api.html#guidelines-for-importing-functions-from-scipy)

> ```py
> # second form
> from scipy.stats import distributions
> distributions.lomax(...)
> ```

{% include note.html %}

[사이파이]의 옛 버전에서는 `scipy` 모듈의 하위 모듈이 아니라 `scipy` 모듈 자체를 사용할 수 있었습니다. `scipy` 모듈은 `numpy` 모듈의 기능을 그대로 제공하되, [사이파이]에 맞게 몇 가지 기능을 강화했습니다[^top-level-scipy] (지금도 하위 호환성을 위해 `scipy` 모듈 자체를 사용할 수는 있습니다[^api-scipy]).

당시에는 `scipy` 모듈 자체에 대해 `sp`라는 약칭을 사용한 것으로 보입니다. 그러나 알 수 없는 이유로 인해 `scipy` 모듈 대신 `numpy` 모듈을 직접 사용하게 되었고, 이에 따라 약칭인 `sp` 또한 사용할 일이 없게 되었습니다.

[^top-level-scipy]: [Basic functions in Numpy (and top-level scipy) - SciPy v0.9](https://docs.scipy.org/doc/scipy-0.9.0/reference/tutorial/basic.html)

    > To begin with, all of the Numpy functions have been subsumed into the scipy namespace so that all of those functions are available without additionally importing Numpy. In addition, the universal functions (addition, subtraction, division) have been altered to not raise exceptions if floating-point errors are encountered; instead, NaN’s and Inf’s are returned in the arrays. To assist in detection of these events, several functions (sp.isnan, sp.isfinite, sp.isinf) are available.

[^api-scipy]: [SciPy API - SciPy](https://docs.scipy.org/doc/scipy/reference/api.html)

    > The scipy namespace itself only contains functions imported from numpy. These functions still exist for backwards compatibility, but should be imported from numpy directly.

관련 문서:

- [DOC: numpy attributes in scipy namespace - GitHub](https://github.com/scipy/scipy/pull/79)
- [Relationship between SciPy and NumPy - Stack Overflow](https://stackoverflow.com/questions/6200910/relationship-between-scipy-and-numpy)
- [DOC: remove `import scipy as sp` abbreviation here and there - GitHub](https://github.com/scipy/scipy/pull/3933)

{% include note.html end=true %}

## 판다스

[판다스]\(pandas)의 경우 직접적으로 언급하지는 않으나, 공식 문서에서는 `pandas` 모듈을 `pd`라고 줄여씁니다.

[판다스]: https://pandas.pydata.org/

[pandas docstring guide - pandas](https://pandas.pydata.org/docs/development/contributing_docstring.html#conventions-for-the-examples)

> Code in examples is assumed to always start with these two lines which are not shown:
>
> ```py
> import numpy as np
> import pandas as pd
> ```

## 사이킷런

[사이킷런]\(scikit-learn)의 경우 직접적으로 언급하지는 않으나, 공식 문서에서는 `import as` 대신 `from import`로 모듈, 함수, 클래스를 적절하게 불러옵니다.

[사이킷런]: https://scikit-learn.org/

[A demo of the Spectral Co-Clustering algorithm - scikit-learn](https://scikit-learn.org/stable/auto_examples/bicluster/plot_spectral_coclustering.html)

> ```py
> from sklearn.datasets import make_biclusters
> from sklearn.cluster import SpectralCoclustering
> from sklearn.metrics import consensus_score
> ```

[An introduction to machine learning with scikit-learn - scikit-learn](https://scikit-learn.org/stable/tutorial/basic/tutorial.html)

> ```py
> >>> from sklearn import datasets
> >>> from sklearn import svm
> ```

## 대스크

[대스크]\(Dask)의 경우 직접적으로 언급하지는 않으나, 공식 문서에서는 `dask.dataframe` 모듈을 `dd`로, `dask.array` 모듈을 `da`로, `dask.bag` 모듈을 `db`로 줄여씁니다.

[대스크]: https://dask.org/

[Dask - Dask](https://docs.dask.org/en/latest/)

> ```py
> import dask.dataframe as dd
> ```
>
> ...
>
> ```py
> import dask.array as da
> ```
>
> ...
> 
> ```py
> import dask.bag as db
> ```

그 외 모듈의 경우 `from import`를 통해 함수나 클래스를 직접 가져오는 것으로 보입니다.

[Futures - Dask](https://docs.dask.org/en/latest/futures.html)
    
> ```py
> from dask.distributed import Client
> ```
>
> ...
>
> ```py
> from dask.distributed import wait
> ```

## 텐서플로

[탠서플로]\(TensorFlow)의 경우 직접적으로 언급하지는 않으나, 공식 문서에서는 `tensorflow` 모듈을 `tf`로 줄여씁니다.

[탠서플로]: https://www.tensorflow.org/

[TensorFlow 2 quickstart for beginners - TensorFlow](https://www.tensorflow.org/tutorials/quickstart/beginner)

> ```py
> import tensorflow as tf
> ```

`tensorflow_datasets` 모듈의 경우 `tfds`로 줄여씁니다.

[TensorFlow Datasets - TensorFlow](https://www.tensorflow.org/datasets/overview)

> ```py
> import tensorflow_datasets as tfds
> ```

## 파이토치

[파이토치]\(PyTorch)의 경우 직접적으로 언급하지는 않으나, 공식 문서에서는 `import torch`를 주로 사용합니다. 하위 모듈이나 함수, 클래스의 경우 이름이 짧으면 그대로 쓰고 이름이 길면 줄여 쓰는 경향이 있습니다.

[파이토치]: https://pytorch.org/

[Start Locally - PyTorch](https://pytorch.org/get-started/locally/)

> ```py
> import torch
> ```

[Distributed Data Parallel - PyTorch](https://pytorch.org/docs/stable/notes/ddp.html)

> ```py
> import torch.distributed as dist
> import torch.multiprocessing as mp
> import torch.nn as nn
> import torch.optim as optim
> from torch.nn.parallel import DistributedDataParallel as DDP
> ```

## 케라스

[케라스]\(Keras)의 경우 직접적으로 언급하지는 않으나, 공식 문서에서는 `keras`는 `keras` 그대로 사용합니다. `keras.layers`의 경우 `layers`로 줄여쓰거나 `keras.layers` 그대로 사용합니다.

[The Functional API - Keras](https://keras.io/guides/functional_api/)

> ```py
> from tensorflow import keras
> from tensorflow.keras import layers
> ```

[Serialization and saving - Keras](https://keras.io/guides/serialization_and_saving/)

> ```py
> outputs = keras.layers.Dense(1)(inputs)
> ```
