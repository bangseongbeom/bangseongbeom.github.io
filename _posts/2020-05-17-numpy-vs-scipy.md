---
category: machine-learning
---

# 넘파이 vs 사이파이

<time id="published" datetime="2020-05-17">2020. 5. 17.</time>

[넘파이]\(NumPy)와 [사이파이]\(SciPy)의 차이점에 대해 다룹니다.

[넘파이]: https://numpy.org/

[사이파이]: https://scipy.org/

## 주요 역할

|| 주요 역할 |
|---|---|
| [넘파이] | 행렬 및 관련 기초 연산 |
| [사이파이] | 수학, 과학 알고리즘 |

**[넘파이]:** 행렬 및 관련 기초 연산을 지원합니다. 행렬 그 자체에 대한 지원과 더불어, 정렬이나 형태 변환과 같이 행렬에서 사용하는 기본적인 연산을 지원합니다.

**[사이파이]:** [넘파이]에서 제공하는 행렬에 기반한 수학, 과학 알고리즘을 지원합니다.

## FFT, 선형대수 알고리즘

|| FFT, 선형대수 알고리즘 |
|---|---|
| [넘파이] | ⚠️ 하위 호환성을 위해 어느 정도의 FFT, 선형대수 알고리즘 지원 |
| [사이파이] | ✔️ 완전한 기능을 가진 FFT, 선형대수 알고리즘 지원 |

[넘파이]의 주요 역할은 행렬과 관련된 기초 연산을 제공하는 것이므로, 원칙적으로는 FFT와 선형대수 알고리즘을 지원할 필요가 없습니다. 하지만 [넘파이]의 선배격인 라이브러리에서 FFT와 선형대수를 지원해왔기에, [넘파이] 역시 호환성을 위해 이러한 기능을 가지게 되었습니다[^faq-scipy][^numpy-dual-numpy].

일반적인 경우라면 [넘파이] 대신 [사이파이]에 있는 FFT, 선형대수 알고리즘을 사용하는 것이 좋습니다. 대부분의 새로운 기능은 [사이파이]에서만 제공하기 때문입니다[^faq-scipy][^numpy-dual-numpy].

[^faq-scipy]: [Frequently Asked Questions - SciPy](https://www.scipy.org/scipylib/faq.html#what-is-the-difference-between-numpy-and-scipy)

    > What is the difference between NumPy and SciPy?
    >
    > In an ideal world, NumPy would contain nothing but the array data type and the most basic operations: indexing, sorting, reshaping, basic elementwise functions, etc. All numerical code would reside in SciPy. However, one of NumPy’s important goals is compatibility, so NumPy tries to retain all features supported by either of its predecessors. Thus, NumPy contains some linear algebra functions and Fourier transforms, even though these more properly belong in SciPy. In any case, SciPy contains more fully-featured versions of the linear algebra modules, as well as many other numerical algorithms. If you are doing scientific computing with Python, you should probably install both NumPy and SciPy. Most new features belong in SciPy rather than NumPy.

[^numpy-dual-numpy]: [Optionally Scipy-accelerated routines (numpy.dual) - NumPy](https://numpy.org/doc/stable/reference/routines.dual.html)

    > Scipy can be built to use accelerated or otherwise improved libraries for FFTs, linear algebra, and special functions.

## 알고리즘의 포트란 의존성

|| 알고리즘의 포트란 의존성 |
|---|---|
| [넘파이] | ❌ 포트란에 의존하지 않음 |
| [사이파이] | ✔️ FFT, 선형대수뿐만 아니라 많은 알고리즘이 포트란에 의존 |

[넘파이]에서 제공하는 FFT와 선형대수 알고리즘의 또다른 특징은 포트란에 의존하지 않는다는 것입니다. 이와 반대로 [사이파이]에서 제공하는 많은 알고리즘은 포트란에 강력히 의존하고 있으며, 이는 FFT와 선형대수 역시 마찬가지입니다. [사이파이]에서 선형대수 알고리즘을 제공하는 `scipy.linalg` 모듈은 포트란으로 짜여진 [LAPACK](http://www.netlib.org/lapack/) 라이브러리를 파이썬에서 사용할 수 있게끔 감싸놓은 것입니다[^wrapping-of-fortran-lapack-scipy].

[^wrapping-of-fortran-lapack-scipy]: [Frequently Asked Questions - SciPy](https://www.scipy.org/scipylib/faq.html#why-both-numpy-linalg-and-scipy-linalg-what-s-the-difference)

    > Why both numpy.linalg and scipy.linalg? What’s the difference?
    >
    > scipy.linalg is a more complete wrapping of Fortran LAPACK using f2py.
    >
    > One of the design goals of NumPy was to make it buildable without a Fortran compiler, and if you don’t have LAPACK available, NumPy will use its own implementation. SciPy requires a Fortran compiler to be built, and heavily depends on wrapped Fortran code.

## 참고

- [Relationship between SciPy and NumPy - Stack Overflow](https://stackoverflow.com/questions/6200910/relationship-between-scipy-and-numpy): 관련 스택오버플로 질문
- [What is the difference between numpy.fft and scipy.fftpack? - Stack Overflow](https://stackoverflow.com/questions/6363154/what-is-the-difference-between-numpy-fft-and-scipy-fftpack): 관련 스택오버플로 질문
