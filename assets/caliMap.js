Reveal.on('ready', async () => {
    const mapColor = "#7a5cff"
    const format = d3.format(",.0f")
    const california = await d3.json('assets/california_2010_albersusa_topo.json', json => json)
    const projection = d3.geoMercator().translate([6750,2400]).scale(3000)
    const path = d3.geoPath(projection)
    const rawData = await d3.csv('assets/cali_data.csv', csv => csv)
    const features = new Map(
        topojson.feature(california, california.objects.ipums_puma_2010)
            .features
            .map(d => [d.properties.GEOID, d])
    )
    const data = rawData.map(obj => ({
        id: obj.STATEFIP.padStart(2, '0') + obj.PUMA.padStart(5, '0'),
        position: features.get(obj.STATEFIP.padStart(2, '0') + obj.PUMA.padStart(5, '0')) && path.centroid(features.get(obj.STATEFIP.padStart(2, '0') + obj.PUMA.padStart(5, '0'))),
        title: features.get(obj.STATEFIP.padStart(2, '0') + obj.PUMA.padStart(5, '0')).properties.Name,
        value: parseFloat(obj.ees_per_capita)
    }))

    const length = d3.scaleLinear([0, d3.max(data, d => d.value)], [0, 150])
    const spike = (length, width = 7) => `M${-width / 2},0L0,${-length}L${width / 2},0`

    const svg = d3.select("#caliMap")
        .append("svg")
        .attr("viewBox", [0, 0, 975, 610])

    svg.append("g")
      .selectAll("path")
      .data(topojson.feature(california, california.objects.ipums_puma_2010).features)
      .join("path")
      .attr("fill", "#0f081f")
      .attr("d", path)

    svg.append("path")
      .datum(topojson.mesh(california, california.objects.ipums_puma_2010, (a, b) => a !== b))
      .attr("fill", "none")
      .attr("stroke", "#f7f7f7")
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 0.25)
      .attr("d", path)

    const legend = svg.append("g")
      .attr("fill", "#777")
      .attr("text-anchor", "middle")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .selectAll("g")
      .data(length.ticks(6).slice(0).reverse())
      .join("g")
      .attr("transform", (d, i) => `translate(${975 - (i + 1) * 20}, 490)`)

    legend.append("path")
        .attr("fill", mapColor)
        .attr("fill-opacity", 0.3)
        .attr("stroke", mapColor)
        .attr("d", d => spike(length(d)))

    legend.append("text")
        .attr("dy", "1.3em")
        .text(length.tickFormat(4, "s"))

    svg.append("g")
        .attr("fill", mapColor)
        .attr("fill-opacity", 0.3)
        .attr("stroke", mapColor)
        .selectAll("path")
        .data(data
            .filter(d => d.position)
            .sort((a, b) => d3.ascending(a.position[1], b.position[1])
                || d3.ascending(a.position[0], b.position[0])))
        .join("path")
        .attr("transform", d => `translate(${d.position})`)
        .attr("d", d => spike(length(d.value)))
        .append("title")
        .text(d => `PUMA: ${d.title}
EEs Due per Capita: ${format(d.value)}`)
})