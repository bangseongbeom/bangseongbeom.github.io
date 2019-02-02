---
title: GraphQL의 단점
category: web
---

[GraphQL(그래프QL)](https://graphql.org/)은 서버 수정 없이 클라이언트가 원하는 쿼리를 날릴 수 있다는 장점이 있지만, 여러 문제에 대한 해결 능력을 갖추고 있어야 합니다.

## 캐싱

트래픽을 줄이기 위한 인간의 노력은 끝이 없습니다. 세월이 흐르는 동안 HTTP도 [여러 가지 캐싱 방법](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/http-caching)을 가지게 되었습니다. 우리는 서버에서 캐시할지 아니면 클라이언트에서 캐시할지, 얼마나 시간이 흐른 뒤에 캐시를 무효화할지와 같은 다양한 정책을 적용할 수 있습니다.

HTTP의 캐싱 전략은 각각의 URL에 정책을 설정하는 형식으로 이루어집니다. 반면 GraphQL은 (주로) `/graphql` 이라는 하나의 URL을 두고 여기에 쿼리를 전송, 응답을 받는 형식입니다. 그렇기에 **각각의 URL이 아닌 하나의 URL**을 사용하는 GraphQL은 HTTP의 캐싱 전략을 사용할 수 없습니다. 캐싱을 위해서는 [영속 쿼리](https://blog.apollographql.com/persisted-graphql-queries-with-apollo-client-119fd7e6bba5)와 같은 GraphQL만의 방법을 찾아야 합니다.

## 파일 업로드

파일 업로드같이 간단한 일조차도, GraphQL을 적용하기 시작하면 문제가 됩니다:

<https://blog.logrocket.com/5-reasons-you-shouldnt-be-using-graphql-61c7846e7ed3>
> 파일 업로드는 GraphQL 명세에 언급된 기능이 아니기 때문에 어떻게 구현할지는 우리 스스로 결정해야 합니다. 몇 가지 방법이 있습니다:
>
> - 베이스64 인코딩을 사용합니다. 다만 업로드 요청 메시지의 크기를 거대하게 만들거나 인코딩/디코딩 과정이 까다로워질 수 있습니다.
> - 업로드를 위한 분리된 API를 마련합니다.
> - [apollo-upload-server](https://github.com/jaydenseric/apollo-upload-server)같이 [GraphQL multipart 요청 명세](https://github.com/jaydenseric/graphql-multipart-request-spec)를 구현하는 라이브러리를 사용합니다.
