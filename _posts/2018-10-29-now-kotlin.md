---
title: 이제 코틀린의 시대가 왔다
categories: android
---

처음 코틀린이 안드로이드에 쓰이기 시작했을 때만 해도 저는 코틀린을 도입하는 것이 생산성을 향상시킬 수 있는지 의심스러웠습니다. 그러나 지금은 다릅니다.

## 문법만이 좋아서는 코틀린을 선택할 수 없다

사람들은 코틀린이 자바에 비해 더 좋은 문법을 가지고 있다고 말합니다. 프로그래밍 언어의 우열을 가리는 건 대단히 까다롭습니다만, 적어도 코틀린은 자바 개발자들이 불편하게 여겼던 부분을 빠르게 해결했습니다. 자바 8에 추가된 람다와 `Optional`, 자바 10에 추가된 `var`는 자바에 도입되기 전부터 코틀린에서 지원하는 기능입니다. 심지어 자바에서 아직 도입 논의 중인 데이터 클래스 역시 기본적으로 지원합니다.

게다가 코틀린은 자바처럼 장황한 방식이 아닙니다. 짧고 간결합니다. 자바의 `Optional`은 코틀린에서 그저 `?`만 붙이는 것으로 충분합니다. 데이터 클래스를 사용하기 위해 따로 [롬복(Lombok)][lombok]과 같은 추가 도구를 설치할 필요가 없습니다.

언어의 좋은 문법으로 인해 생산성 향상이 이루어지는 것은 사실이지만, 도리어 잘못된 언어 선택으로 인해 생산성이 떨어질 수도 있습니다. 언어와 관련된 프레임워크와 도구들이 언어를 효과적으로 지원하지 않는다면 말이죠. 문법 강조도 제대로 되지 않고 기존 프레임워크도 마음대로 쓸 수 없다면 아무리 문법이 좋아봤자 쓰기 힘들 것입니다. 이처럼 우리는 언어를 선택함으로써 얻는 이익뿐만 아니라 잠재적인 문제점까지 함께 고려하는 것이 필요합니다.

[lombok]: https://projectlombok.org/

## 도구가 언어를 지원해야 한다

코딩은 그저 문자를 타이핑하는 것만으로 끝나지 않습니다. 자동 완성이나 문법 강조 없이는 높은 생산성을 기대하기 어렵습니다. 편집기(IDE)가 언어를 얼마냐 지원하는지는 언어를 선택하는 과정에서 중요한 역할을 합니다.

코틀린이 그토록 빨리 인기를 누릴 수 있었던 이유는, 코틀린을 만든 주체가 안드로이드 스튜디오를 개발한 [제트브레인(JetBrains)][jetbrains]이기 때문입니다. 자사에서 개발한 언어이니 당연히 문법 강조나 자동 완성도 자바와 동일할 정도로 강력하게 지원하겠죠.

이처럼 언어와 편집기를 만드는 주체가 같다는 것은 언어 선택에 있어 큰 장점입니다. 아마 이토록 좋은 편집기가 있었기에 초기 사람들이 코틀린을 더 쉽게 선택할 수 있었을 것입니다.

[jetbrains]: https://www.jetbrains.com/

## 프레임워크가 언어를 지원해야 한다

프레임워크의 지원 또한 중요합니다. 프레임워크가 언어를 제대로 지원하지 못할 경우 언어의 장점을 최대한으로 살릴 수 없기 때문입니다. 즉, 안드로이드라는 프레임워크가 코틀린을 지원할 것인지라는 마지막 걸림돌이 남아 있습니다.

저는 2016년 처음 코틀린을 접했습니다. 그때는 과연 안드로이드가 코틀린을 지원할 것인지 의심스러웠습니다. 하지만 2018년 현재, 안드로이드는 거의 완벽하게 코틀린을 지원합니다! 2017년, [구글은 코틀린을 공식적으로 지원하기로 발표했습니다][kotlin-official]. 그리고 2018년, 마침내 안드로이드 SDK에서 코틀린 API 문서를 제공하기 시작했습니다[^kotlin-friendly-sdk]. 심지어 코틀린을 위한 [KTX][ktx]라는 개발 지원 도구도 만들었습니다.

이제 코틀린의 시대가 왔습니다.

[kotlin-official]: https://blog.jetbrains.com/kotlin/2017/05/kotlin-on-android-now-official/

[^kotlin-friendly-sdk]:
    <https://developer.android.com/kotlin/>

    > Starting with Android 9 (API level 28), the Android SDK contains nullability annotations to help avoid NullPointerExceptions. API reference documentation is also available in Kotlin.

[ktx]: https://developer.android.com/kotlin/ktx

## 참고

- <https://dzone.com/articles/why-kotlin-is-the-future-of-android-app-developmen>
- <https://medium.com/@Pinterest_Engineering/the-case-against-kotlin-2c574cb87953>


