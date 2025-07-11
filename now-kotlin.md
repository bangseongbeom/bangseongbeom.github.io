---
redirectFrom: [/posts/now-kotlin.html]
---

[🏠 방성범 블로그](/README.md) > [🤖 안드로이드](/android.md)

# 이제서야 코틀린을 도입하게 된 이유

<time id="published" datetime="2018-10-29">2018. 10. 29.</time>

코틀린의 좋은 문법, 그리고 안드로이드 스튜디오와 안드로이드 SDK의 훌륭한 코틀린 지원 기능으로 인해 코틀린을 선택하게 되었습니다. 이전에는 망설일 법한 부분도 있었지만, 이제는 아닙니다.

## 좋은 문법

**코틀린은 자바 개발자들이 불편하게 여겨왔던 부분을 일찌감치 해결했습니다.** 자바 8에 추가된 람다와 `Optional`, 자바 10에 추가된 `var`는 자바에 도입되기 전부터 코틀린에서 지원하던 기능입니다. 심지어 자바에서는 아직 도입 논의 중이라[^data-class] [롬복(Lombok)][lombok]과 같은 외부 도구를 써야 하는 데이터 클래스 역시, 코틀린에서는 기본적으로 지원합니다.

[^data-class]: <http://cr.openjdk.java.net/~briangoetz/amber/datum.html>

[lombok]: https://projectlombok.org/

**코틀린의 짧고 간결한 문법이야말로 자바와 대비되는 매력 포인트입니다.** 자바처럼 장황하지 않습니다. 자바에서는 `null` 안전성을 위해 [`Optional.map()`][optional-map], [`Optional.orElse()`][optional-orelse]처럼 메서드를 호출해야 하지만, 코틀린에서는 [`?.`][safe-call], [`?:`][elvis]같이 기호로 구현합니다[^nullable-vs-optional].

[optional-map]: https://download.java.net/java/early_access/jdk11/docs/api/java.base/java/util/Optional.html#map(java.util.function.Function)
[optional-orelse]: https://download.java.net/java/early_access/jdk11/docs/api/java.base/java/util/Optional.html#orElse(T)
[safe-call]: https://kotlinlang.org/docs/reference/null-safety.html#safe-calls
[elvis]: https://kotlinlang.org/docs/reference/null-safety.html#elvis-operator

[^nullable-vs-optional]: <https://medium.com/@fatihcoskun/kotlin-nullable-types-vs-java-optional-988c50853692>

**코틀린이 아무리 좋은 문법을 가지고 있더라도, 언어와 관련된 프레임워크와 도구들이 언어를 효과적으로 지원하는 것 역시 중요합니다.** 문법 강조도 제대로 되지 않고 기존 프레임워크도 마음대로 쓸 수 없다면 아무리 문법이 좋아봤자 쓰기 힘들 것입니다. 이처럼 우리는 언어를 선택함으로써 얻는 이익뿐만 아니라 잠재적인 문제점까지 함께 고려하는 것이 필요합니다. 그렇지 않으면 장점보다 단점이 더 커져버리게 됩니다.

## 안드로이드 스튜디오의 코틀린 지원

코틀린은 [인텔리제이 아이디어(IntelliJ IDEA)][intellij-idea]를 개발한 [제트브레인(JetBrains)][jetbrains]에서 만들었습니다. 안드로이드 스튜디오는 인텔리제이 아이디어를 기반으로 합니다.

[intellij-idea]: https://www.jetbrains.com/idea/
[jetbrains]: https://www.jetbrains.com/

자사에서 개발한 언어이니만큼, 인텔리제이 아이디어는 코틀린을 위한 문법 강조나 자동 완성 기능을 자바와 견줄 만한 정도로 강력하게 지원합니다. **즉, 안드로이드 스튜디오는 코틀린을 가장 완벽하게 지원하는 IDE입니다.**

## 안드로이드 SDK의 코틀린 지원

언어와 관련된 SDK나 프레임워크의 지원 또한 중요합니다. 이들이 언어를 제대로 지원하지 못할 경우 언어의 장점을 최대한으로 살릴 수 없기 때문입니다.

**코틀린의 가장 매력적인 기능은 `null` 안정성을 보장한다는 것입니다.** `null`이 들어갈 수 있는 타입과 그렇지 못한 타입을 나누어 `null`을 효과적으로 처리합니다. 자바에서는 모든 타입이 `null`을 가질 수 있어 `NullPointerException`과 같은 문제가 자주 발생하지만, 코틀린은 아닙니다.

안드로이드 SDK는 자바로 짜여져 있습니다. 코틀린과 달리, 자바는 `null` 안정성을 보장하지 못합니다. **그렇기에 논리 상 또는 문서 상으로는 `null`이 나올 수 없는데도 불구하고, 코틀린에서 안드로이드 SDK를 사용하기 위해서는 불필요한 `null` 처리 코드를 작성해야 했습니다.**

코틀린은 자바와의 상호 운용성을 위해 자바 메서드에 `@NotNull` 애너테이션이 붙어 있다면 `null`이 나오지 않음을 보장하는 것이라 취급합니다[^nullability-annotations]. **안드로이드 파이(9.0)부터는 자주 쓰이는 대부분의 SDK 메서드에 `@NotNull` 애너테이션을 붙이게 되어, 이제 더 이상 불필요한 `null` 처리 코드를 작성하지 않아도 됩니다[^android-pie-sdk-is-now-more-kotlin].**

[^nullability-annotations]: <https://kotlinlang.org/docs/reference/java-interop.html#nullability-annotations>

[^android-pie-sdk-is-now-more-kotlin]:
    <https://android-developers.googleblog.com/2018/08/android-pie-sdk-is-now-more-kotlin.html>

    > As part of yesterday's Android 9 announcement, we have also released a new Android SDK that contains nullability annotations for some of the most frequently used APIs. This will preserve the null-safety guarantee when your Kotlin code is calling into any annotated APIs in the SDK. Even if you are using the Java programming language, you can still benefit from these annotations by using Android Studio to catch nullability contract violations.

안드로이드는 코틀린만이 가진 고급 문법을 지원하기 위해 [KTX][ktx]라는 확장 기능을 개발하고 있습니다. 자바에는 없지만 코틀린에는 있는 언어 기능을 활용하여 안드로이드 SDK를 손쉽게 사용할 수 있도록 도와주는 도구입니다.

[ktx]: https://developer.android.com/kotlin/ktx

2017년 코틀린을 안드로이드의 공식 언어로 채택했을 때에 비하면[^official-kotlin], 이제는 정말로 안드로이드가 코틀린을 지원한다고 볼 수 있게 되었습니다.

[^official-kotlin]: <https://blog.jetbrains.com/kotlin/2017/05/kotlin-on-android-now-official/>

## 결론: 이제 코틀린을 쓸 때가 왔습니다

처음 안드로이드에 코틀린이 쓰이기 시작했을 때만 해도, 안드로이드 SDK는 코틀린을 제대로 지원하지 않았습니다. SDK가 공식적으로 지원하지 않는 언어를 사용한다면 언어가 가진 생산성을 최대한으로 발휘할 수 없다고 판단해 도입을 미뤄왔습니다. 그러나 지금의 안드로이드는 코틀린을 거의 완벽하게 지원합니다.

## 참고

- <https://dzone.com/articles/why-kotlin-is-the-future-of-android-app-developmen>
- <https://medium.com/@Pinterest_Engineering/the-case-against-kotlin-2c574cb87953>
- <https://medium.com/@techyourchance/finally-some-ideas-which-are-beyond-it-is-cool-and-i-like-it-good-job-sharing-them-3a51d08c4e06>
