---
title: GraphQL의 단점
category: web
---

[GraphQL(그래프QL)](https://graphql.org/)은 서버 수정 없이 클라이언트가 원하는 쿼리를 날릴 수 있어 API를 설계하거나 변경하는 비용을 획기적으로 낮출 수 있습니다. 그러나 HTTP에서 제공하는 기존 인프라를 그대로 사용하지 못하고 GraphQL 스타일로 다시 재구현해야만 하는 부담이 있습니다.

## HTTP 캐싱 불가능

통신량을 줄이기 위한 인간의 노력은 끝이 없습니다. 세월이 흐르는 동안 HTTP도 [여러 가지 캐싱 방법](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/http-caching)을 가지게 되었습니다. HTTP에는 서버에서 캐시할지 아니면 클라이언트에서 캐시할지, 얼마나 시간이 흐른 뒤에 캐시를 무효화할지와 같은 다양한 정책이 준비되어 있습니다. HTTP에서 제공하는 캐싱 정책은 단순히 HTTP 헤더에 명시하는 것만으로 손쉽게 적용할 수 있습니다.

HTTP의 캐싱 전략은 각각의 URL에 저마다의 정책을 설정하는 형식으로 이루어집니다. REST API 역시 URL마다 개별적인 데이터를 제공하게끔 하므로, HTTP에서 제공하는 캐싱 전략을 그대로 사용하는 것이 가능합니다. 반면 GraphQL은 (주로) `/graphql` 이라는 하나의 URL을 두고 여기에 쿼리를 전송, 응답을 받는 형식입니다. **그렇기에 모든 데이터를 하나의 URL에서 처리하는 GraphQL은 HTTP에서 제공하는 캐싱 전략을 그대로 사용할 수 없습니다.**

GraphQL에서는 GraphQL만의 캐싱 방식을 찾아야 합니다. [영속 쿼리(persisted query)](https://blog.apollographql.com/persisted-graphql-queries-with-apollo-client-119fd7e6bba5), [아폴로 엔진(Apollo Engine)](https://blog.apollographql.com/caching-graphql-results-in-your-cdn-54299832b8e2) 등이 있습니다.

## 직접 구현하는 파일 업로드

GraphQL은 성장하고 있는 언어이자 생태계입니다. 페이스북이 공개한 GraphQL 명세에서는 아직 모든 상황에 대한 규칙을 만들어두지 않았습니다. GraphQL 명세에서 언급하지 않는 내용은, 명세 바깥에서 개발자 스스로 해결해야만 합니다.

GraphQL에서는 파일 업로드에 대한 구체적인 구현 방법을 정의내리지 않았습니다. 다만 몇 가지 해결책이 있기는 합니다:

<https://blog.logrocket.com/5-reasons-you-shouldnt-be-using-graphql-61c7846e7ed3>

> 파일 업로드는 GraphQL 명세에 언급된 기능이 아니기 때문에 어떻게 구현할지는 우리 스스로 결정해야 합니다. 몇 가지 방법이 있습니다:
>
> - 베이스64 인코딩을 사용합니다. 다만 업로드 요청 메시지의 크기를 거대하게 만들거나 인코딩/디코딩 과정이 까다로워질 수 있습니다.
> - 업로드를 위한 분리된 API를 마련합니다.
> - [apollo-upload-server](https://github.com/jaydenseric/apollo-upload-server)같이 [GraphQL multipart 요청 명세](https://github.com/jaydenseric/graphql-multipart-request-spec)를 구현하는 라이브러리를 사용합니다.

## 요청 필터링의 어려움

각 URL마다 정해진 데이터를 건네주는 REST API와 달리, GraphQL은 클라이언트가 필요한 데이터를 스스로 결정합니다. GraphQL은 데이터 요청의 형태가 다양하기 때문에 잘못된 요청을 필터링하기가 까다롭습니다:

<https://apihandyman.io/and-graphql-for-all-a-few-things-to-think-about-before-blindly-dumping-rest-for-graphql/#graphql-may-have-unexpected-side-effects-and-data-volumes-and-server-usage>

> 몇몇 주의력 없는 클라이언트 개발자들은 필요한 양보다 더 많은 양의 데이터를 요청하기도 합니다. 그런 거대하고 복잡한 데이터 요청은 여러분의 시스템에 문제를 일으킬 것입니다. 이러한 문제가 발생하는 이유는 우리가 클라이언트 개발자에게 데이터 요청에 대한 전적인 권한을 제공했기 때문입니다. 여러분은 GraphQL 스키마, 그리고 스키마 뒤에서 무슨 일이 일어나고 있는지에 대해 항상 주시해야만 합니다.

## REST API에서도 쓸 수 있는 여러 대안

여러 단점에도 불구하고 GraphQL의 쿼리를 통한 통신량 감소와 스키마를 통한 문서화는 여전히 유용합니다. **그러나 기존의 REST API 체제에서도 간단한 쿼리를 날리거나 스키마를 정의할 수 있도록 하는 명세가 있습니다.** [JSON:API](https://jsonapi.org/)는 필드 명시 및 정렬, [OpenAPI(Swagger)](https://swagger.io/)는 스키마 정의 기능을 제공하는 명세입니다:

<https://jsonapi.org/format/#fetching-includes>

```http
GET /articles/1?include=comments.author HTTP/1.1
Accept: application/vnd.api+json
```

<https://swagger.io/docs/specification/basic-structure/>

```yaml
paths:
  /users:
    get:
      summary: Returns a list of users.
      description: Optional extended description in CommonMark or HTML.
      responses:
        '200':    # status code
          description: A JSON array of user names
          content:
            application/json:
              schema: 
                type: array
                items: 
                  type: string
```

물론 위에서 소개한 기술들은 GraphQL과 같이 포괄적인 기능을 지원하지는 않습니다. **광범위한 기능을 하나의 통일된 방식으로 사용하기 위해서는 GraphQL를 사용하는 것이 옳습니다.** 다만 GraphQL의 모든 기능이 필요하지 않은 경우라면 REST API와 함께 [JSON:API](https://jsonapi.org/)나 [OpenAPI(Swagger)](https://swagger.io/)를 사용하는 것도 나쁘지 않은 선택이라 할 수 있습니다.
