Reveal.on('ready', async () => {
    const us = await d3.json('assets/puma_2010_albersusa_topo.json', json => json)
    const projection = d3.geoAlbersUsa().translate([975/2,610/2]).scale(1300)
    const path = d3.geoPath(projection)

    const svg = d3.select("#map")
        .append("svg")
        .attr("viewBox", [0, 0, 975, 610])

    svg.append("g")
      .selectAll("path")
      .data(topojson.feature(us, us.objects.ipums_puma_2010).features)
      .join("path")
      .attr("fill", "#0f081f")
      .attr("d", path)

    svg.append("path")
      .datum(topojson.mesh(us, us.objects.ipums_puma_2010, (a, b) => a !== b))
      .attr("fill", "none")
      .attr("stroke", "#f7f7f7")
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 0.25)
      .attr("d", path)      
})