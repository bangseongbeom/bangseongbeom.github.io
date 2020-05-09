---
title: 기계 학습 라이브러리들의 'import as' 약칭
category: machine-learning
---

`numpy`를 `np`로 줄여쓰는 것을 아시나요? 기계 학습과 관련된 파이썬 라이브러리들의 `import as` 약칭을 정리했습니다.

---

대부분의 파이썬 라이브러리에서는 `import as`를 사용하지 않습니다. `from import`를 통해 특정 함수나 클래스를 불러오거나, 드물게 (특히 모듈 이름이 짧을 때) `import`를 통해 직접 모듈을 불러오고는 합니다. 문서나 예시를 읽어봐도 `import as`를 쓰는 경우는 무척 드룹니다.

이와 달리 수학이나 통계, 기계 학습과 관련된 라이브러리들은 문서나 예시에서 관습적으로 `import as`를 사용하는 것을 확인할 수 있습니다. 아예 [넘파이]\(NumPy)는 공식 문서에서 `import as`에 대해 직접 언급합니다[^import-conventions-throughout-numpy].

[넘파이]: https://numpy.org/

[^import-conventions-throughout-numpy]: [A Guide to NumPy/SciPy Documentation - NumPy](https://numpy.org/doc/stable/docs/howto_document.html#import-conventions)

    > The following import conventions are used throughout the NumPy source and documentation:
    >
    > ```py
    > import numpy as np
    > import matplotlib as mpl
    > import matplotlib.pyplot as plt
    > ```

반드시 `import as`를 사용할 필요는 없습니다. 하지만 관습적으로 쓰이는 약칭을 존중한다면, 다른 사람이 나의 코드를 볼 때 `import`가 어떻게 되어있는지 굳이 확인해보지 않아도 됩니다.

## 넘파이

[넘파이]의 경우,  공식 문서와 소스 코드에서 `numpy` 모듈을 `np`로 줄여쓸 것이라 **직접** 언급합니다[^import-conventions-throughout-numpy].

{% include example.html %}

```py
import numpy as np
```

{% include example.html end=true %}

## 맷플롯립

[넘파이] 공식 문서와 소스 코드에서 [맷플롯립]\(Matplotlib)의 `matplotlib` 모듈을 `mpl`, `matplotlib.pyplot` 모듈을 `plt`으로 줄여쓸 것이라 **직접** 언급합니다[^import-conventions-throughout-numpy].

[맷플롯립]: https://matplotlib.org/

{% include example.html %}

```py
import matplotlib as mpl
import matplotlib.pyplot as plt
```

{% include example.html end=true %}

[맷플롯립]의 다른 하위 모듈에 대한 약칭에 대해서는 직접 언급하고 있지 않습니다. 공식 문서를 살펴보면 모듈자체의 이름을 `as`로 가져오거나, 아니면 모듈에서 사용할 함수나 클래스를 하나씩 `from import`로 가져오는 것으로 보입니다[^mlab-ticker-pdfpages-figure].

[^mlab-ticker-pdfpages-figure]: [How-to - Matplotlib](https://matplotlib.org/faq/howto_faq.html)

    > ```py
    > import matplotlib.mlab as mlab
    > import matplotlib.ticker as ticker
    > ```
    >
    > ```py
    > from matplotlib.backends.backend_pdf import PdfPages
    > ```
    >
    > ```py
    > from matplotlib.figure import Figure
    > ```

{% include example.html %}

경우에 따라 모듈 자체를 `import as`로 가져옵니다:

```py
import matplotlib.mlab as mlab
import matplotlib.ticker as ticker
```

{% include example.html end=true %}

{% include example.html %}

경우에 따라 함수나 클래스를 `from import`로 가져옵니다:

```py
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.figure import Figure
```

{% include example.html end=true %}

## 사이파이

[사이파이]\(SciPy)의 경우 약칭을 사용하지 않을 것을 **직접** 권고합니다[^do-not-abbreviate-scipy][^imported-separately].

[사이파이]: https://scipy.org/

[^do-not-abbreviate-scipy]: [A Guide to NumPy/SciPy Documentation - NumPy](https://numpy.org/doc/stable/docs/howto_document.html#import-conventions)

    > Do not abbreviate scipy. There is no motivating use case to abbreviate it in the real world, so we avoid it in the documentation to avoid confusion.
    
[^imported-separately]: [Introduction - SciPy](https://docs.scipy.org/doc/scipy/reference/tutorial/general.html#scipy-organization)

    > SciPy sub-packages need to be imported separately, for example:

    > ```py
    > >>> from scipy import linalg, optimize
    > ```

{% include example.html %}

```py
from scipy import linalg, optimize
```

{% include example.html end=true %}

## 판다스

[판다스]\(pandas)의 경우 직접적으로 언급하지는 않으나, 공식 문서에서는 `pandas` 모듈을 `pd`라고 줄여쓰는 것으로 보입니다[^code-in-examples].

[판다스]: https://pandas.pydata.org/

[^code-in-examples]: [pandas docstring guide - pandas](https://pandas.pydata.org/docs/development/contributing_docstring.html#conventions-for-the-examples)

    > Code in examples is assumed to always start with these two lines which are not shown:
    >
    > ```py
    > import numpy as np
    > import pandas as pd
    > ```
    >
    > Any other module used in the examples must be explicitly imported, one per line (as recommended in PEP 8#imports) and avoiding aliases.

{% include example.html %}

```py
import pandas as pd
```

{% include example.html end=true %}

## 사이킷런

[사이킷런]\(scikit-learn)의 경우 직접적으로 언급하지는 않으나, 공식 문서와 예시를 살펴보면 `import as`를 사용하는 것 대신 `from import`로 모듈, 함수, 클래스를 적절하게 불러옵니다[^print-changed-only][^plot-spectral-coclustering][^tutorial].

[사이킷런]: https://scikit-learn.org/

[^print-changed-only]: [Compact estimator representations - scikit-learn](https://scikit-learn.org/stable/auto_examples/plot_changed_only_pprint_parameter.html)

    > ```py
    > from sklearn.linear_model import LogisticRegression
    > from sklearn import set_config
    > ```


[^plot-spectral-coclustering]: [A demo of the Spectral Co-Clustering algorithm - scikit-learn](https://scikit-learn.org/stable/auto_examples/bicluster/plot_spectral_coclustering.html)

    > ```py
    > from sklearn.datasets import make_biclusters
    > from sklearn.cluster import SpectralCoclustering
    > from sklearn.metrics import consensus_score
    > ```

[^tutorial]: [An introduction to machine learning with scikit-learn - scikit-learn](https://scikit-learn.org/stable/tutorial/basic/tutorial.html)

    > ```py
    > >>> from sklearn import datasets
    > >>> from sklearn import svm
    > ```

{% include example.html %}

경우에 따라 모듈 자체를 `from import`로 가져옵니다:

```py
from sklearn import datasets
from sklearn import svm
```

{% include example.html end=true %}

{% include example.html %}

경우에 따라 함수와 클래스를 `from import`로 가져옵니다:

```py
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import make_biclusters
```

{% include example.html end=true %}

## 대스크

[대스크]\(Dask)의 경우 직접적으로 언급하지는 않으나, `dask.dataframe` 모듈을 `dd`로, `dask.array` 모듈을 `da`로, `dask.bag` 모듈을 `db`로 줄여씁니다[^dask-dask].

[대스크]: https://dask.org/

[^dask-dask]: [Dask - Dask](https://docs.dask.org/en/latest/)

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

{% include example.html %}

```py
import dask.dataframe as dd
import dask.array as da
import dask.bag as db
```

{% include example.html end=true %}

그 외 모듈의 경우 `from import`를 통해 함수나 클래스를 직접 가져오는 것으로 보입니다[^dask-futures].

[^dask-futures]: [Futures - Dask](https://docs.dask.org/en/latest/futures.html)
    
    > ```py
    > from dask.distributed import Client
    > ```
    >
    > ...
    >
    > ```py
    > from dask.distributed import wait
    > ```

{% include example.html %}

```py
from dask.distributed import Client
from dask.distributed import wait
```

{% include example.html end=true %}

## 텐서플로

`tf`

## 파이토치

`torch`

## 케라스

`keras`, `layers`

## 참고

- [Scikit-learn import convention - Stack Overflow](https://stackoverflow.com/questions/55562269/scikit-learn-import-convention): 관련 스택오버플로 질문
