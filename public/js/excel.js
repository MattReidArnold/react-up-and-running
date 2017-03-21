var headers = [
    "Book", "Author", "Language", "Published", "Sales"
];

var data = [
    ["The Lord of the Rings", "J. R. R. Tolkien", "English", "1954–1955", "150 million"],
    ["Le Petit Prince (The Little Prince)", "Antoine de Saint-Exupéry", "French", "1943", "140 million"],
    ["Harry Potter and the Philosopher's Stone", "J. K. Rowling", "English", "1997", "107 million"],
    ["And Then There Were None", "Agatha Christie", "English", "1939", "100 million"],
    ["Dream of the Red Chamber", "Cao Xueqin", "Chinese", "1754–1791", "100 million"],
    ["The Hobbit", "J. R. R. Tolkien", "English", "1937", "100 million"],
    ["She: A History of Adventure", "H. Rider Haggard", "English", "1887", "100 million"],
];

var Excel = React.createClass({
    displayName: 'Excel',
    _preSearchData: null,
    _log: [],
    componentDidMount: function(){
        document.onkeydown = function(e){
            if (e.altKey && e.shiftKey && e.keyCode === 82){
                this._replay();
            }
        }.bind(this);
    },
    getInitialState: function () {
        return {
            data: this.props.initialData,
            sortby: null,
            descending: false,
            edit: null,
            search: false,
        };
    },
    propTypes: {
        headers: React.PropTypes.arrayOf(
            React.PropTypes.string
        ),
        initialData: React.PropTypes.arrayOf(
            React.PropTypes.arrayOf(
                React.PropTypes.any
            )
        ),
    },
    render: function () {
        return (
            React.DOM.div(null,
                this._renderToolbar(),
                this._renderTable()
            )
        );
    },
    _download: function (format, ev) {
        var contents = format === 'json'
            ? JSON.stringify(this.state.data)
            : this.state.data.reduce(function (result, row) {
                return result
                    + row.reduce(function (rowResult, cell, idx) {
                        return rowResult
                            + '"'
                            + cell.replace(/"/g, '""')
                            + '"'
                            + (idx < row.length - 1 ? ',' : '');
                    }, '')
                    + "\n";
            }, '');
        
        var URL = window.URL || window.webkitURL;
        var blob = new Blob([contents], {type: 'text/' + format});
        ev.target.href = URL.createObjectURL(blob);
        ev.target.download = 'data.' + format;
    },
    _logSetState: function(newState) {
        this._log.push(JSON.parse(JSON.stringify(
            this._log.length === 0 ? this.state : newState
        )));
        this.setState(newState);
    },
    _renderSearch: function () {
        if (!this.state.search) {
            return null;
        }
        return (
            React.DOM.tr({ onChange: this._search },
                this.props.headers.map(function (_ignore, idx) {
                    return React.DOM.td({ key: idx },
                        React.DOM.input({
                            type: 'text',
                            'data-idx': idx,
                        })
                    );
                })
            )
        );
    },
    _renderToolbar: function () {
        return React.DOM.div({className: 'toolbar'},
            React.DOM.button({
                onClick: this._toggleSearch,
            }, 'Search'),
            React.DOM.button({
                onClick: this._download.bind(this, 'json'),
                href: 'data.json'
            }, 'Export JSON'),
            React.DOM.button({
                onClick: this._download.bind(this, 'csv'),
                href: 'data.json'
            }, 'Export CSV')
        );
    },
    _renderTable: function () {
        return (
            React.DOM.table(null,
                React.DOM.thead({ onClick: this._sort },
                    React.DOM.tr(null,
                        this.props.headers.map(function (title, idx) {
                            if (this.state.sortby === idx) {
                                title += this.state.descending ? ' \u2191' : ' \u2193';
                            }
                            return React.DOM.th({ key: idx }, title);
                        }, this)
                    )
                ),
                React.DOM.tbody({ onDoubleClick: this._showEditor },
                    this._renderSearch(),
                    this.state.data.map(function (row, rowidx) {
                        return (
                            React.DOM.tr({ key: rowidx },
                                row.map(function (cell, idx) {
                                    var content = cell;

                                    var edit = this.state.edit;

                                    if (edit && edit.row === rowidx && edit.cell === idx) {
                                        content = React.DOM.form({ onSubmit: this._save },
                                            React.DOM.input({
                                                type: 'text',
                                                defaultValue: content
                                            })
                                        );
                                    }

                                    return React.DOM.td({
                                        key: idx,
                                        'data-row': rowidx
                                    }, content);
                                }, this)
                            )
                        );
                    }, this)
                )
            )
        );
    },
    _replay: function(){
        if (this._log.length === 0){
            console.warn('No state to replay yet');
            return;
        }
        var idx = -1;
        var interval = setInterval(function () {
            idx++;
            if ( idx === this._log.length - 1) {
                clearInterval(interval);
            }
            this.setState(this._log[idx]);
        }.bind(this), 1000);
    },
    _toggleSearch: function () {
        if(this.state.search){
            this._logSetState({
                data: this._preSearchData,
                search:false,
            });
            this._preSearchData = null;
        } else {
            this._preSearchData = this.state.data;
            this._logSetState({
                search: true,
            });
        }
    },
    _search: function(e) {
        var needle = e.target.value.toLowerCase();
        if(!needle) {
            this._logSetState({data: this._preSearchData});
            return;
        }
        var idx = e.target.dataset.idx;
        var searchData = this._preSearchData.filter(function(row){
            return row[idx].toString().toLowerCase().indexOf(needle) > -1;
        });
        this._logSetState({data: searchData})
    }, 
    _save: function (e) {
        e.preventDefault();
        var input = e.target.firstChild;
        var data = this.state.data.slice();

        data[this.state.edit.row][this.state.edit.cell] = input.value;

        this._logSetState({
            edit: null,
            data: data,
        });
    },
    _sort: function (e) {
        var column = e.target.cellIndex;
        var data = this.state.data.slice();
        var descending = this.state.sortby === column && !this.state.descending
        data.sort(function (a, b) {
            return descending
                ? (a[column] < b[column] ? 1 : -1)
                : (a[column] > b[column] ? 1 : -1);
        });
        this._logSetState({
            data: data,
            sortby: column,
            descending: descending
        });
    },
    _showEditor: function (e) {
        this._logSetState({
            edit: {
                row: parseInt(e.target.dataset.row, 10),
                cell: e.target.cellIndex,
            }
        })
    }
});

ReactDOM.render(
    React.createElement(Excel, {
        headers: headers,
        initialData: data,
    }),
    document.getElementById("app")
);