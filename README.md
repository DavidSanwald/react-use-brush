<h1 align="center">Welcome to react-use-brush 🖌</h1>
<p>
  <a href="https://github.com/DavidSanwald/react-use-brush/workflows/build/badge.svg" target="_blank">
    <img alt="Build Status" src="https://github.com/DavidSanwald/react-use-brush/workflows/build/badge.svg">
  </a>
  <a href="https://www.npmjs.com/package/react-use-brush" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/react-use-brush.svg">
  </a>
  <a href="https://github.com/DavidSanwald/react-use-brush#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/DavidSanwald/react-use-brush/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/DavidSanwald/react-use-brush/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/github/license/DavidSanwald/react-use-brush" />
  </a>
  <a href="https://twitter.com/DavidSanwald" target="_blank">
    <img alt="Twitter: DavidSanwald" src="https://img.shields.io/twitter/follow/DavidSanwald.svg?style=social" />
  </a>
</p>

> brush hook with a nice api to brush and filter your chart data

## Install

```sh
npm i -S react-use-brush
```

## Usage

You can try a live demo here: <https://codesandbox.io/s/nervous-rosalind-kfxeq>

```jsx
const Chart = () => {
  const [state, rect, rectRef, bind, selection] = useBrush();
  // ...

  return (
    <>
      <svg {...bind} width={width} height={height}>
        <rect
          {...rect}
          ref={rectRef}
          fill="none"
          stroke="black"
          pointerEvents="all"
        />
      </svg>
    </>
  );
};
```

## Run tests

```sh
npm i
npm build
npm test
```

## Author

👤 **DavidSanwald**

- Website: https://www.davidsanwald.net/
- Twitter: [@DavidSanwald](https://twitter.com/DavidSanwald)
- Github: [@DavidSanwald](https://github.com/DavidSanwald)

## Show your 💚

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2019 [DavidSanwald](https://github.com/DavidSanwald).<br />
This project is [MIT](https://github.com/DavidSanwald/react-use-brush/blob/master/LICENSE) licensed.

---
