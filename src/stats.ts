// @ts-expect-error
const stats = new Stats()

document.body.appendChild(stats.dom)

requestAnimationFrame(function loop() {
  stats.update()
  requestAnimationFrame(loop)
})

export {}
