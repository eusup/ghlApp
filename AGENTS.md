# CSS 작성 규칙

- 사용자는 CSS 속성을 축약형으로 작성하는 것을 선호하지 않는다.
- `animation`, `background` 등 축약 가능한 속성은 각 세부 속성으로 모두 풀어서 작성한다.
- 예를 들어 `animation: noticePendulum 2s linear infinite;` 대신 아래와 같이 작성한다.

```css
animation-name: noticePendulum;
animation-duration: 2s;
animation-timing-function: linear;
animation-iteration-count: infinite;
```

- 이 규칙의 예외는 `padding`, `margin`, `transform`뿐이며, 이 세 속성은 축약 또는 함수 조합 형태로 작성할 수 있다.
