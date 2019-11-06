'use strict';

// (function() {
    let data = 'no data';
    let allData = 'no data';
    let svg = '';
    let currGeneration = 'All';
    let currLegendary = 'All';
    let colors = '';

    const measurements = {
        width: 800,
        height: 600, 
        margin: 50 
    };

    window.onload = function() {
        svg = d3.select('#graph')
            .append('svg')
            .attr('height', measurements.height)
            .attr('width', measurements.width)
        
        // Load data
        d3.csv('data/pokemon.csv')
            .then((csvdata) => {
                data = csvdata;
                allData = csvdata;
            })
            .then(() => {

                colors = d3.scaleOrdinal()
                    .domain([...new Set(data.map((row) => row['Type 1']))])
                    .range([ '#4E79A7', '#A0CBE8', '#F28E2B', '#FFBE&D', '#59A14F', '#8CD17D', '#B6992D', '#499894'
                    , '#86BCB6', '#86BCB7', '#E15759', '#FF9D9A', '#79706E', '#BAB0AC', '#D37295']);

                // make legend

                d3.select('#legend')
                    .data([...new Set(data.map((row) => row['Type 1']))])
                    .enter()
                    .append("circle")
                    .attr("cx", 100)
                    .attr("cy", function(d,i){ return 100 + i*20}) // 100 is where the first dot appears. 25 is the distance between dots
                    .attr("r", 5)
                    .style("fill", function(d){ return colors(d)});
            

                makeScatterPlot(currGeneration, currLegendary);
                
                let generation = [...new Set(allData.map((row) => row['Generation']))];
                generation.push('All');
                let initialGeneration = 1;


                let dropdownG = d3.select('#generationfilter')
                    .append('select')
                    .attr('id', 'gen')
                    .attr('name', 'Generation')
                    .on('change', function() {
                        currGeneration = this.value;
                        makeScatterPlot(this, currLegendary)
                    })

                let optionsG = dropdownG.selectAll('option')
                    .data(generation)
                    .enter()
                    .append('option')
                    .text(function(d) { return d;})
                    .attr('value', function(d) { return d; })
                    .attr('selected', function(d) { return d == initialGeneration;});

                let legendary = [...new Set(allData.map((row) => row['Legendary']))]
                legendary.push('All');
                let initialLegendary = 'All';

                let dropdownL = d3.select('#legendaryfilter')
                    .append('select')
                    .attr('id', 'leg')
                    .attr('name', 'Legendary')
                    .on('change', function() {
                        currLegendary = this.value;
                        makeScatterPlot(currGeneration, this)
                    });

                let optionsL = dropdownL.selectAll('option')
                    .data(legendary)
                    .enter()
                    .append('option')
                    .text(function(d) { return d;})
                    .attr('value', function(d) { return d; })
                    .attr('selected', function(d) { return d == initialLegendary});
            });
    }

    function makeScatterPlot(currG, currL) {
        filterData(currG, currL);
        svg.html('');

        // get array of values for both the axes
        let spDef = data.map((row) => parseInt(row['Sp. Def']));
        let total = data.map((row) => parseInt(row['Total']));

        // find axes limits
        let axesLimits = findMinMax(spDef, total);

        // draw axes 
        let funcs = drawAxes(axesLimits, 'Sp. Def', 'Total', svg, {min: measurements.margin, max: measurements.width - measurements.margin}, {min: measurements.margin, max: measurements.height - measurements.margin});

        // plot data as points on the graph and add toollkit functionality 
        plotData(funcs);

        // //draw title and makr axes labels 
        makeLabels('Pokemon: Soecial Defence vs. Total Stats', 'Sp. Def', 'Total');

        
    }

   
    function plotData(funcs) {
        console.log('in');
        // get special defence data as array
        let spDef_data = data.map((row) => +row['Sp. Def'])
        let spDef_limits = d3.extent(spDef_data)

        // mapping functions
        let xMap = funcs.x;
        let yMap = funcs.y;

        // make tooltip
        let div = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0)
        
        // append data to svg and plot
        svg.selectAll('.dot')
            .data(data)
            .enter()
            .append('circle')
                .attr('cx', xMap)
                .attr('cy', yMap)
                .attr('r', 5)
                .style('fill', function(d) { return colors((d['Type 1']));})
            .on('mouseover', (d) => {
                div.transition()
                    .duration(200)
                    .style('opacity', 0.9);
                div.html('<pre>' +
                        d['Name'] + '<br/>' +
                        d['Type 1'] + '<br/>' +
                        d['Type 2'] + '<br/>' +
                        '<pre>'
                )
                .style('left', (d3.event.pageX) + 'px')
                .style('top', (d3.event.pageY - 28) + 'px');
            })
            .on('mouseout', (d) => {
                div.transition()
                    .duration(500)
                    .style('opacity', 0);
            })

            d3.select('.tooltip')
                .select('.tooltip')
                .style('color', 'white');
    }

    function makeLabels(title, x, y) {
        svg.append('text')
            .attr('x', 50)
            .attr('y', 30)
            .attr('id', 'title')
            .text(title)
        
        svg.append('text')
            .attr('x', 300)
            .attr('y', 590)
            .attr('id', 'x-label')
            .text(x)

        svg.append('text')
            .attr('transform', 'translate(15, 300)rotate(-90)')
            .attr('id', 'y-label')
            .text(y)
    }

    function drawAxes(limits, x, y, svg, rangeX, rangeY) {
        //console.log(limits);
        
        // return x value from a row of data
        let xValue = function(d) { return +d[x]; }

        // function to scale x value
        let xScale = d3.scaleLinear()
            .domain([limits.defMin - 5, limits.defMax + 5]) // give domain buffer room
            .range([rangeX.min, rangeX.max]);

        // xMap returns a scaled x value from a row of data
        let xMap = function(d) { return xScale(xValue(d)); };

        // plot x-axis at bottom of SVG
        let xAxis = d3.axisBottom().scale(xScale);
        svg.append('g')
            .attr('transform', 'translate(0, ' + rangeY.max + ')')
            .call(xAxis);

        // return y value from a row of data
        let yValue = function(d) { return +d[y]; }

        // function to scale y
        let yScale = d3.scaleLinear()
            .domain([limits.totalMax + 5, limits.totalMin - 5]) // give domain buffer
            .range([rangeY.min, rangeY.max]);

        // yMap returns a scaled y value from a row of data
        let yMap = function (d) { return yScale(yValue(d)); };

        // plot y-axis at the left of SVG
        let yAxis = d3.axisLeft().scale(yScale);
        svg.append('g')
            .attr('transform', 'translate(' + rangeX.min + ', 0)')
            .call(yAxis);

        // return mapping and scaling functions
        return {
            x: xMap,
            y: yMap,
            xScale: xScale,
            yScale: yScale
        };
    }

    function filterData(currG, currL) {
        if(currGeneration == 'All' && currLegendary == 'All') {
            data = allData;
        } else if(currGeneration == 'All' && currLegendary != 'All') {
            data = allData.filter(function(d) { return d['Legendary'] == currLegendary});
            
        } else if(currGeneration != 'All' && currLegendary == 'All') {
            console.log('in');
            data = allData.filter(function(d) { return d['Generation'] == currGeneration});
        } else {
            data = allData.filter(function(d) { return d['Generation'] == currGeneration && d['Legendary'] == currLegendary});
        } 
    }

    function findMinMax(x, y) {
        return {
            'defMin': d3.min(x),
            'defMax': d3.max(x),
            'totalMin': d3.min(y),
            'totalMax': d3.max(y)
        };
    }
    
// })