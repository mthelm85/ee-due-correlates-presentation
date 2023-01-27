Reveal.on("ready", async () => {
    const format = d3.format(",.2f");
    const nyc = await d3.json(
        "assets/shape_files/nyc_2010_albersusa_topo.json",
        (json) => json
    );
    const projection = d3.geoMercator().translate([81900, 49485]).scale(63100);
    const path = d3.geoPath(projection);
    const features = new Map(
        topojson
            .feature(nyc, nyc.objects.ipums_puma_2010)
            .features.map((d) => [d.properties.GEOID, d])
    );

    const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed);

    const svg = d3
        .select("#nycMap")
        .append("svg")
        .attr("viewBox", [0, 0, 975, 610]);

    const g = svg.append("g");

    function zoomed(event) {
        const { transform } = event;
        g.attr("transform", transform);
        g.attr("stroke-width", 1 / transform.k);
    }

    g.append("g")
        .selectAll("path")
        .data(topojson.feature(nyc, nyc.objects.ipums_puma_2010).features)
        .join("path")
        .attr("fill", "#0f081f")
        .attr("d", path)
        .on("mouseover", ({ currentTarget }) => {
            d3.select(currentTarget).style("filter", "brightness(1.9)");
        })
        .on("mouseout", ({ currentTarget }) => {
            d3.select(currentTarget).style("filter", "brightness(1)");
        })
        .append("title")
        .text((d) => `PUMA: ${d.properties.Name}`);

    g.append("path")
        .datum(
            topojson.mesh(nyc, nyc.objects.ipums_puma_2010, (a, b) => a !== b)
        )
        .attr("fill", "none")
        .attr("stroke", "#fff")
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 0.25)
        .attr("d", path);

    g.selectAll("text")
        .data(topojson.feature(nyc, nyc.objects.ipums_puma_2010).features)
        .enter()
        .append("text")
        .attr("class", "place-label")
        .attr("x", (d) => path.centroid(d)[0])
        .attr("y", (d) => path.centroid(d)[1])
        .attr("text-anchor", "middle")
        .text((d) =>
            d.properties.Name.split("-")[1].replace("Community District", "")
        );

    svg.call(zoom);
});
