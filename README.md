# weather-app

https://orluca.github.io/weather-app/
A simple weather app created with Vanilla JS and ChartJS.

### More Feature ideas:

- [ ] Light/Dark mode toggle
- [ ] For the big overcast symbol it could be nicer to use a more 'sophisticated' image/symbol with some color instead of Font Awesome
- [ ] Temperature line changes color the hotter/colder it gets (from blue to violet/pink)
- [x] Create more column divisions for the app container, so that the forecast chart can be made a little bit bigger

### todos

- [x] better loading spinner
- [x] better icons
- [x] figure out color scheme
- [x] closing modal window by clicking into background should be disabled on startup (if forecast exists...)
- [x] implement wind direction functionality
- [x] if you click on the 'open map' button while the map is already open, the map should close
- [x] also, the map button should be a TOGGLE, meaning it stays pressed as long as the map is open
- [x] timezones sind auf der x achse noch nicht mit einberechnet
- [x] units of the rain axis?
- [x] to avoid clipping between the °C datalabels and the overcast symbols, it might be good to always have around 3-4°C of 'leeway' between the highest yaxis value and the highest temp point
- [x] figure out why overcast symbols/times and the datalabels of temps arent aligned
- [x] wenn karte bereit offen ist und man dann einen text search macht, sollte der map button toggle wieder deaktivieren
- [x] last rain mm tick and last forecast symbol kommen sich in die quere. vl letztes overcast symbol einfach auslassen?
- [x] der button vom text search funktioniert noch nicht
- [x] day annotations not working in some cases (e.g. northern ireland)
- [x] datapoints on chart still way to ugly
- [x] make search window responsive
- [x] zuviel abstand zwischen map/search results und der top section
- [ ] make search more elegant: only close search window once the forecast and everything else has loaded
- [ ] animations
- [ ] refactor everything
- [ ] the map confirm and cancel buttons are still a bit ugly
- [ ] tooltips for chart points. also maybe a crosshair?
- [ ] make 'small' window layout the default for full as well?
- [ ] ERROR handling isn't implemented at all so far
- [ ] BUG: search window doesn't always close after confirming search
- [ ] Alle Sonnensymbole zu mond in nacht für chart symbols
- [ ] icon/link to Github repo
- [ ] für wind richtung vielleicht anderes symbol statt pfeil (kompass wäre sexy)

### possible additional components

- [ ] noch eine textbeschreibung des current weathers mit dabei packen?
- [ ] local time dazufügen?

icon creators: freepik, surang, creative stall premium, good ware, alfredo hernandez
