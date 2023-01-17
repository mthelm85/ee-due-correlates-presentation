Reveal.on("ready", async () => {
    // const mapColor = "#7a5cff"
    const format = d3.format(",.2f");
    const california = await d3.json(
        "assets/california_2010_albersusa_topo.json",
        (json) => json
    );
    const projection = d3.geoMercator().translate([6500, 2350]).scale(2900);
    const path = d3.geoPath(projection);
    const rawData = await d3.csv("assets/cali_data.csv", (csv) => csv);
    const features = new Map(
        topojson
            .feature(california, california.objects.ipums_puma_2010)
            .features.map((d) => [d.properties.GEOID, d])
    );
    const data = rawData.map((obj) => ({
        id: obj.STATEFIP.padStart(2, "0") + obj.PUMA.padStart(5, "0"),
        position:
            features.get(
                obj.STATEFIP.padStart(2, "0") + obj.PUMA.padStart(5, "0")
            ) &&
            path.centroid(
                features.get(
                    obj.STATEFIP.padStart(2, "0") + obj.PUMA.padStart(5, "0")
                )
            ),
        title: features.get(
            obj.STATEFIP.padStart(2, "0") + obj.PUMA.padStart(5, "0")
        ).properties.Name,
        value: Math.log(parseFloat(obj.ees_per_capita) + 1),
    }));

    const color = d3
        .scaleSequential()
        .domain(d3.extent(data.map((d) => d.value)))
        .interpolator(d3.interpolatePurples);

    const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed);

    // const length = d3.scaleLinear([0, d3.max(data, d => d.value)], [0, 150])
    // const spike = (length, width = 2) => `M${-width / 2},0L0,${-length}L${width / 2},0`

    const svg = d3
        .select("#caliMap")
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
        .data(
            topojson.feature(california, california.objects.ipums_puma_2010)
                .features
        )
        .join("path")
        .attr("fill", (d) =>
            data.find((el) => el.id == d.properties.GEOID) == undefined
                ? color(0)
                : color(data.find((el) => el.id == d.properties.GEOID).value)
        )
        //   .attr("fill", "#0f081f")
        .attr("d", path)
        .on("mouseover", ({ currentTarget }) => {
            d3.select(currentTarget).style("filter", "brightness(1.1)");
        })
        .on("mouseout", ({ currentTarget }) => {
            d3.select(currentTarget).style("filter", "brightness(1)");
        })
        .append("title")
        .text(
            (d) => `PUMA: ${d.properties.Name}
Log of EEs Due per Capita: ${format(
                data.find((el) => el.id == d.properties.GEOID) == undefined
                    ? 0
                    : data.find((el) => el.id == d.properties.GEOID).value
            )}`
        );

    g.append("path")
        .datum(
            topojson.mesh(
                california,
                california.objects.ipums_puma_2010,
                (a, b) => a !== b
            )
        )
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 0.25)
        .attr("d", path);

    // const legend = g.append("g")
    //   .attr("fill", "#777")
    //   .attr("text-anchor", "middle")
    //   .attr("font-family", "sans-serif")
    //   .attr("font-size", 10)
    //   .selectAll("g")
    //   .data(length.ticks(6).slice(0).reverse())
    //   .join("g")
    //   .attr("transform", (d, i) => `translate(${975 - (i + 1) * 20}, 490)`)

    //     legend.append("path")
    //         .attr("fill", mapColor)
    //         .attr("fill-opacity", 0.3)
    //         .attr("stroke", mapColor)
    //         .attr("d", d => spike(length(d)))

    //     legend.append("text")
    //         .attr("dy", "1.3em")
    //         .text(length.tickFormat(4, "s"))

    //     g.append("g")
    //         .attr("fill", mapColor)
    //         .attr("fill-opacity", 0.1)
    //         .attr("stroke", mapColor)
    //         .attr("stroke-opacity", 0.3)
    //         .selectAll("path")
    //         .data(data
    //             .filter(d => d.position)
    //             .sort((a, b) => d3.ascending(a.position[1], b.position[1])
    //                 || d3.ascending(a.position[0], b.position[0])))
    //         .join("path")
    //         .attr("transform", d => `translate(${d.position})`)
    //         .attr("d", d => spike(length(d.value)))
    //         .append("title")
    //         .text(d => `PUMA: ${d.title}
    // EEs Due per Capita: ${format(d.value)}`)

    svg.call(zoom);
});
