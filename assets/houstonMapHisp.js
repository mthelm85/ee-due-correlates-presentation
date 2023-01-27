Reveal.on("ready", async () => {
    const spikeColor = "#ebf702";
    const format = d3.format(",.2f");
    const houston = await d3.json(
        "assets/shape_files/houston_2010_albersusa_topo.json",
        (json) => json
    );
    const projection = d3.geoMercator().translate([59800, 19700]).scale(35600);
    const path = d3.geoPath(projection);
    const rawData = await d3.csv("assets/data/houston_data.csv", (csv) => csv);
    const features = new Map(
        topojson
            .feature(houston, houston.objects.ipums_puma_2010)
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
        value: parseFloat(obj.ees_per_capita),
    }));

    const hispData = rawData.map((obj) => ({
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
        value: parseFloat(obj.p_hisp) * 100,
    }));

    const color = d3
        .scaleQuantize()
        .domain(d3.extent(data.map((d) => d.value)))
        .range([
            "#0f081f",
            "#1d103d",
            "#2f1a61",
            "#3f2382",
            "#502da6",
            "#6237cc",
            "#7240ed",
        ]);

    const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed);

    const length = d3.scaleQuantize(
        d3.extent(hispData.map((d) => d.value)),
        [4, 10, 18, 29, 43, 60, 79]
    );
    const spike = (length, width = 5) =>
        `M${-width / 2},0L0,${-length}L${width / 2},0`;

    const svg = d3
        .select("#houstonMapHisp")
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
            topojson.feature(houston, houston.objects.ipums_puma_2010).features
        )
        .join("path")
        .attr("fill", (d) =>
            data.find((el) => el.id == d.properties.GEOID) == undefined
                ? color(0)
                : color(data.find((el) => el.id == d.properties.GEOID).value)
        )
        .attr("d", path)
        .on("mouseover", ({ currentTarget }) => {
            d3.select(currentTarget).style("filter", "brightness(1.9)");
        })
        .on("mouseout", ({ currentTarget }) => {
            d3.select(currentTarget).style("filter", "brightness(1)");
        })
        .append("title")
        .text(
            (d) => `PUMA: ${d.properties.Name}
EEs Due per Capita: ${format(
                data.find((el) => el.id == d.properties.GEOID) == undefined
                    ? 0
                    : data.find((el) => el.id == d.properties.GEOID).value
            )}`
        );

    g.append("path")
        .datum(
            topojson.mesh(
                houston,
                houston.objects.ipums_puma_2010,
                (a, b) => a !== b
            )
        )
        .attr("fill", "none")
        .attr("stroke", "#fff")
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 0.25)
        .attr("d", path);

    g.selectAll("text")
        .data(
            topojson.feature(houston, houston.objects.ipums_puma_2010).features
        )
        .enter()
        .append("text")
        .attr("class", "place-label")
        .attr("x", (d) => path.centroid(d)[0])
        .attr("y", (d) => path.centroid(d)[1] + 5)
        .attr("text-anchor", "middle")
        .text((d) => d.properties.Name.split("--")[0]);

    // spikes
    const legend = g
        .append("g")
        .attr("fill", "#777")
        .attr("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .selectAll("g")
        .data(length.ticks(6).slice(0).reverse())
        .join("g")
        .attr("transform", (d, i) => `translate(${975 - (i + 1) * 20}, 490)`);

    legend
        .append("text")
        .text("%")
        .attr("transform", (d, i) => `translate(${975 - (i + 1) * 20}, 490)`);

    legend
        .append("path")
        .attr("fill", spikeColor)
        .attr("fill-opacity", 0.4)
        .attr("stroke", spikeColor)
        .attr("d", (d) => spike(length(d)));

    legend.append("text").attr("dy", "1.3em").text(length.tickFormat(7, "s"));

    g.append("g")
        .attr("fill", spikeColor)
        .attr("fill-opacity", 0.3)
        .attr("stroke", spikeColor)
        .attr("stroke-opacity", 0.8)
        .selectAll("path")
        .data(
            hispData
                .filter((d) => d.position)
                .sort(
                    (a, b) =>
                        d3.ascending(a.position[1], b.position[1]) ||
                        d3.ascending(a.position[0], b.position[0])
                )
        )
        .join("path")
        .attr("transform", (d) => `translate(${d.position})`)
        .attr("d", (d) => spike(length(d.value)))
        .append("title")
        .text((d) => `Hispanic: ${format(d.value)}%`);

    svg.call(zoom);
});
