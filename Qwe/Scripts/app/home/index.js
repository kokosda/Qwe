(function ($, w) {
    $(function () {
        var viewModelConstructor = function (options) {
            this.getPlayersCount = function () {
                return this.formDataModel.playersCount();
            };

            this.getCellsCount = function () {
                return this.cellContainerModel.listModel.getSize();
            };

            this.getCellByIndex = function (index) {
                return this.cellContainerModel.listModel.getCellByIndex(index);
            };

            this.switchUi = function (isPlayGameUi) {
                this.formDataModel.switchUi(isPlayGameUi);
                this.playButtonBlockModel.switchUi(isPlayGameUi);
                this.cellContainerModel.switchUi(isPlayGameUi);
            };

            this.engageButtonDisabled = function (disabled) {
                this.cellContainerModel.engageButtonBlockModel.isDisabled(disabled);
            };

            this.getNickname = function () {
                return this.formDataModel.nickname();
            };

            this.getScoreBoard = function () {
                return this.cellContainerModel.scoreBoardModel;
            };

            var messageBlockConstructor = function () {
                this.isVisible = ko.observable(false);
                this.message = ko.observable("");
            };

            var formDataConstructor = function () {
                this.onNicknameKeyup = function (i, e) {
                    this.nickname($(e.target).val());
                    this.onChanged();
                };

                this.onPlayersCountChanged = function () {
                    this.onChanged();

                    self.cellContainerModel.updateListModel();
                };

                this.onChanged = function () {
                    var canEnablePlay = this.nickname().length > 0 && this.playersCount() >= self.minPlayersCount && this.playersCount() <= self.maxPlayersCount;

                    self.playButtonBlockModel.isPlayDisabled(!canEnablePlay);
                };

                this.switchUi = function (isPlayGameUi) {
                    if (isPlayGameUi) {
                        this.inputsAreVisible(false);
                        this.spansAreVisible(true);
                    }
                    else {
                        this.inputsAreVisible(true);
                        this.spansAreVisible(false);
                    }
                };

                this.nickname = ko.observable("");
                this.playersCount = ko.observable(options.defaultPlayersCount);
                this.availablePlayersCount = w.helpers.range(self.minPlayersCount, self.maxPlayersCount - self.minPlayersCount + 1);
                this.inputsAreVisible = ko.observable(true);
                this.spansAreVisible = ko.observable(false);
            };

            var playButtonBlockConstructor = function () {
                this.onPlayClicked = function () {
                    w.helpers.raiseEvent(self.events.playClicked);
                };
                this.onStopClicked = function () {
                    w.helpers.raiseEvent(self.events.stopClicked);
                };
                this.switchUi = function (isPlayGameUi) {
                    if (isPlayGameUi) {
                        this.isPlayVisible(false);
                        this.isStopVisible(true);
                    }
                    else {
                        this.isPlayVisible(true);
                        this.isStopVisible(false);
                    }
                };

                this.isPlayDisabled = ko.observable(true);
                this.isPlayVisible = ko.observable(true);
                this.isStopVisible = ko.observable(false);
            };

            var cellContainerModelConstructor = function () {
                this.activatePlayGameUi = function () {
                    canPlay = true;
                    this.switchUi(true);
                };

                this.activateStopGameUi = function () {
                    canPlay = false;
                    this.switchUi(false);
                };

                this.switchUi = function (isPlayGameUi) {
                    this.listModel.switchUi(isPlayGameUi);
                    this.engageButtonBlockModel.switchUi(isPlayGameUi);
                };

                this.updateListModel = function () {
                    this.listModel.init();
                };

                var cellModelConstructor = function (index) {
                    this.onClicked = function () {
                        w.helpers.raiseEvent(self.events.cellClicked, { cell: this });
                    };

                    this.select = function () {
                        selected(true);
                        this.updateCssClass();
                    };

                    this.unselect = function () {
                        selected(false);
                        this.updateCssClass();
                    };

                    this.isSelected = function () {
                        return selected();
                    };

                    this.engage = function () {
                        engaged(true);
                        this.updateCssClass();
                    };

                    this.unengage = function () {
                        engaged(false);
                        this.updateCssClass();
                    };

                    this.isEngaged = function () {
                        return engaged();
                    };

                    this.setText = function (value) {
                        this.text(value);
                    };

                    this.updateCssClass = function () {
                        var result = "cell ";

                        if (engaged()) {
                            result += "cell_engaged";
                        }
                        else if (selected()) {
                            result += "cell_selected";
                        }

                        this.cssClass(result);
                    };

                    this.switchUi = function (isPlayGameUi) {
                        selected(false);
                        engaged(false);
                        this.updateCssClass();
                    };

                    this.index = index;
                    var selected = ko.observable(false);
                    var engaged = ko.observable(false);
                    this.cssClass = ko.observable("cell");
                    this.text = ko.observable("");
                };

                var listConstructor = function () {
                    this.getCells = function () {
                        return cells;
                    };

                    this.getSize = function () {
                        return size;
                    };

                    this.init = function () {
                        cells.removeAll();
                        size = self.formDataModel.playersCount() - 1;

                        for (var i = 0; i < size; i++) {
                            cells.push(new cellModelConstructor(i));
                        }
                    };

                    this.getCellByIndex = function (index) {
                        return cells()[index];
                    };

                    this.switchUi = function (isPlayGameUi) {
                        ko.utils.arrayForEach(cells(), function (cell) {
                            cell.switchUi(isPlayGameUi);
                        });
                    };

                    var cells = ko.observableArray([]);
                    var size = self.formDataModel.playersCount() - 1;

                    this.init();
                };

                var engageButtonBlockConstructor = function () {
                    this.isDisabled = ko.observable(true);
                    this.onClicked = function () {
                        w.helpers.raiseEvent(self.events.engageClicked);
                    };
                    this.switchUi = function (isPlayGameUi) {
                        this.isDisabled(true);
                    };
                };

                var scoreBoardConstructor = function () {
                    this.push = function (data) {
                        let di = new dataItemConstructor(data.nickname, data.score);

                        this.dataList.push(di);
                        return this.dataList.indexOf(di);
                    };

                    this.clear = function () {
                        this.dataList.removeAll();
                    };

                    this.updateScore = function (index, score) {
                        this.dataList()[index].setScore(score);
                    };

                    this.setMaxScore = function (value) {
                        this.maxScore(value);
                    };

                    this.setWinner = function (index) {
                        this.dataList()[index].setWinner();
                    }

                    var dataItemConstructor = function (nickname, score) {
                        this.setScore = function (value) {
                            this.score(value);
                        };

                        this.setWinner = function () {
                            this.rowCssClass("winner");
                        };

                        this.nickname = nickname;
                        this.score = ko.observable(score);
                        this.rowCssClass = ko.observable("");
                    };

                    this.dataList = ko.observableArray([]);
                    this.maxScore = ko.observable(0);
                };

                var canPlay = false;
                this.listModel = new listConstructor();
                this.selectedCells = {};
                this.engageButtonBlockModel = new engageButtonBlockConstructor();
                this.scoreBoardModel = new scoreBoardConstructor();
            };

            var self = this;
            self.minPlayersCount = options.minPlayersCount;
            self.maxPlayersCount = options.maxPlayersCount;
            self.messageBlockModel = new messageBlockConstructor();
            self.playButtonBlockModel = new playButtonBlockConstructor();
            self.formDataModel = new formDataConstructor();
            self.cellContainerModel = new cellContainerModelConstructor();
            self.events = {
                "playClicked": "playClicked",
                "stopClicked": "stopClicked",
                "engageClicked": "engageClicked",
                "cellClicked": "cellClicked"
            };
        };

        var options = {
            minPlayersCount: 3,
            defaultPlayersCount: 10,
            maxPlayersCount: 13
        };

        w.viewModel = new viewModelConstructor(options);

        ko.applyBindings(w.viewModel);
    });
})(jQuery, window);