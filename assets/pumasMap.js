Reveal.on('ready', async () => {
    const us = await d3.json('assets/puma_2010_albersusa_topo.json', json => json)
    const projection = d3.geoAlbersUsa().translate([975/2,610/2]).scale(1300)
    const path = d3.geoPath(projection)

    const zoom_usa = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", zoomed_usa)

    const svg = d3.select("#map")
        .append("svg")
        .attr("viewBox", [0, 0, 975, 610])

    const g_usa = svg.append("g")

    function zoomed_usa(event) {
        const {transform} = event
        g_usa.attr("transform", transform)
        g_usa.attr("stroke-width", 1 / transform.k)
    }

    g_usa.append("g")
      .selectAll("path")
      .data(topojson.feature(us, us.objects.ipums_puma_2010).features)
      .join("path")
      .attr("fill", "#0f081f")
      .attr("d", path)
      .append("title")
      .text(d => `PUMA: ${d.properties.Name}`)

    g_usa.append("path")
      .datum(topojson.mesh(us, us.objects.ipums_puma_2010, (a, b) => a !== b))
      .attr("fill", "none")
      .attr("stroke", "#f7f7f7")
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 0.25)
      .attr("d", path)      

    svg.call(zoom_usa)
})