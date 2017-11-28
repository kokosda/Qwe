(function ($, w) {
    $(function () {
        var gameConstructor = function () {
            var playButtonClickedEventHandler = function (e) {
                isPlaying = true;
                init();
                viewModel.switchUi(isPlaying);
            };
            
            var stopButtonClickedEventHandler = function (e) {
                isPlaying = false;
                viewModel.switchUi(isPlaying);
            };

            var cellClickedEventHandler = function (e) {
                if (!isPlaying) {
                    return;
                }

                let cell = e.detail.args.cell;

                playerCellClickedHandler(cell);
            };

            var engageClickedEventHandler = function (e) {
                player.tryEngageCell();

                if (player.isCellEngagedByPlayer()) {
                    viewModel.engageButtonDisabled(true);
                }
            };

            var playerCellClickedHandler = function (cell) {
                player.selectCell(cell);

                if (player.getCell()) {
                    viewModel.engageButtonDisabled(false);
                }
                else {
                    viewModel.engageButtonDisabled(true);
                }
            };

            var init = function () {
                maxScore = viewModel.getPlayersCount() * 3;
                scoreBoard.clear();
                scoreBoard.setMaxScore(maxScore);
                players = [];
                players.push(new playerConstructor(viewModel.getNickname(), false));
                player = players[0];
                isOver = false;

                for (var i = 1; i < viewModel.getPlayersCount(); i++) {
                    players.push(new playerConstructor("bot" + i.toString(), true));
                }

                let d = $.Deferred();

                setTimeout(() => {
                    loop(d);
                }, 200);

                d.then(() => {
                    isPlaying = false;
                    isOver = true;
                    players = null;
                    viewModel.switchUi(isPlaying);
                })
                .fail((err) => console.log(err));
            };

            var loop = function (deferred) {
                let playingCalls = [];

                for (let i = 1; i < viewModel.getPlayersCount(); i++) {
                    playingCalls.push(players[i].play());
                }

                $.when.apply($, playingCalls)
                      .then(() => setTimeout(() => {
                          playingCalls = null;

                          if (!isOver && isPlaying) {
                              loop(deferred);
                          }
                          else {
                              setWinner(players);
                              deferred.resolve();
                          }
                      }, 200));
            };

            var getPlayerOnSelectedCell = function (cell) {
                var result = null;

                if (cell) {
                    for (let p of players) {
                        if (p.getCell() == cell) {
                            result = p;
                            break;
                        }
                    }
                }

                return result;
            };

            var getPlayerOnEngagedCell = function (cell) {
                var result = null;

                for (let p of players) {
                    if (p.getCell() == cell && p.isCellEngagedByPlayer()) {
                        result = p;
                        break;
                    }
                }

                return result;
            };
            
            var setWinner = function (players) {
                for (let p of players) {
                    if (p.trySetWinner()) {
                        break;
                    }
                }
            };

            var tryUnselectCell = function (cell) {
                if (cell && cell.isSelected()) {
                    if (!getPlayerOnSelectedCell(cell)) {
                        cell.unselect();
                    }
                }
            };

            var tryUnengageCell = function (cell) {
                if (cell && cell.isEngaged()) {
                    if (!getPlayerOnEngagedCell(cell)) {
                        cell.unengage();
                    }
                }
            };

            var isCellSelected = function (cell) {
                var result = false;

                if (cell) {
                    result = cell.isSelected();
                }

                return result;
            };

            var isCellEngaged = function (cell) {
                var result = false;

                if (cell) {
                    result = cell.isEngaged();
                }

                return result;
            };

            var playerConstructor = function (nickname, isBot) {
                this.getCell = function () {
                    return cell;
                };

                this.setCell = function (cellParam) {
                    cell = cellParam;
                };

                this.unsetCell = function () {
                    cell = null;
                };

                this.getTimeLag = function () {
                    var second = 2000;
                    var result = Math.floor(w.helpers.getRandom(second / 3, second / 5));

                    return result;
                };

                this.getNickname = function () {
                    return nickname;
                };

                this.play = function () {
                    if (!isBot) {
                        return;
                    }
                    
                    let result = $.Deferred();
                    let d = $.Deferred();

                    setTimeout(() => {
                        try {
                            self.selectCell();

                            if (!self.getCell()) {
                                d.reject("Warning: unable to select a cell for " + self.getNickname() + ".");
                            }
                            else {
                                d.resolve();
                            }
                        }
                        catch (err) {
                            d.reject(err);
                        }
                    }, self.getTimeLag());

                    d.then(() => {
                        let d2 = $.Deferred();

                        setTimeout(() => {
                            self.tryEngageCell();
                            d2.resolve();
                        }, self.getTimeLag());

                        return d2;
                    })
                     .then(() => {
                         setTimeout(() => {
                             self.selectCell(self.getCell());
                             result.resolve();
                         }, self.getTimeLag());
                     })
                     .fail((err) => {
                         console.log(err)

                         if (typeof err == "string") {
                             result.resolve();
                         }
                     });

                    return result;
                };

                this.selectCell = function (cellParam) {
                    let cell;

                    if (!cellParam) {
                        let cellsCount = viewModel.getCellsCount();
                        let cellIndex = w.helpers.getRandomInt(0, cellsCount - 1);

                        cell = viewModel.getCellByIndex(cellIndex);
                    }
                    else {
                        cell = cellParam;
                    }

                    let shouldSelect = true;

                    if (cell == this.getCell()) {
                        if ((!this.isCellEngagedByPlayer()) && this.isCellSelectedByPlayer()) {
                            this.unselectCell();
                            shouldSelect = false;
                        }
                    }
                    else {
                        if (this.isCellEngagedByPlayer()) {
                            this.unengageCell();
                        }
                        if (this.getCell()) {
                            this.unselectCell();
                        }
                    }

                    if (shouldSelect) {
                        this.setCell(cell);
                        cell.select();
                        w.helpers.raiseEvent(game.events.cellSelected, { cell: cell, player: this });
                    }
                };

                this.tryEngageCell = function () {
                    if (!isCellEngaged(this.getCell())) {
                        if (this.getCell()) {
                            this.getCell().engage();
                            cellEngaged = true;
                            w.helpers.raiseEvent(game.events.cellEngaged, { cell: this.getCell(), player: this });
                            this.getCell().setText("Press!");
                        }
                    }
                };

                this.unengageCell = function () {
                    this.getCell().setText("");
                    cellEngaged = false;
                    tryUnengageCell(this.getCell());
                };

                this.unselectCell = function () {
                    let cell = this.getCell();

                    this.unsetCell();
                    tryUnselectCell(cell);
                };

                var selectedCellEventHandler = function (e) {
                    let cell = e.detail.args.cell;
                    let player = e.detail.args.player;

                    if (player == self) {
                        if (self.getCell() == cell && self.isCellEngagedByPlayer()) {
                            if (!isOver) {
                                score++;
                                scoreBoard.updateScore(scoreBoardIndex, score);
                            }

                            self.unengageCell();
                            w.helpers.raiseEvent(game.events.cellSelectionReset, { cell: cell, player: player });
                            self.unselectCell();

                            if (score >= maxScore) {
                                isOver = true;
                            }
                        }
                    }
                };

                this.isCellEngagedByPlayer = function () {
                    return isCellEngaged(this.getCell()) && cellEngaged;
                };

                this.isCellSelectedByPlayer = function () {
                    return isCellSelected(this.getCell());
                };

                this.trySetWinner = function() {
                    var result = false;

                    if (score >= maxScore) {
                        scoreBoard.setWinner(scoreBoardIndex);
                        result = true;
                    }

                    return result;
                };

                var engagedCellEventHandler = function (e) {
                    var cell = e.detail.args.cell;
                    var player = e.detail.args.player;

                    if (player != self) {
                        if (self.getCell() == cell) {
                            self.unsetCell();
                        }
                    }
                };

                var selectionResetCellEventHandler = function (e) {
                    let cell = e.detail.args.cell;
                    let player = e.detail.args.player;

                    if (player != self) {
                        if (self.getCell() == cell) {
                            self.unsetCell();
                        }
                    }
                };

                var self = this;
                var nickname = nickname;
                var isBot = isBot;
                var cell = null;
                var score = 0;
                var scoreBoardIndex = 0;
                var cellEngaged = false;

                w.helpers.registerEventHandler(game.events.cellSelected, selectedCellEventHandler);
                w.helpers.registerEventHandler(game.events.cellEngaged, engagedCellEventHandler);
                w.helpers.registerEventHandler(game.events.cellSelectionReset, selectionResetCellEventHandler);
                scoreBoardIndex = scoreBoard.push({ nickname: this.getNickname(), score: score });
            };
            
            var self = this;
            var isPlaying = false;
            var viewModel = w.viewModel;
            var players = null;
            var player = null;
            var maxScore = 0;
            var isOver = false;
            var scoreBoard = viewModel.getScoreBoard();

            self.events = {
                "cellSelected": "cellSelected",
                "cellEngaged": "cellEngaged",
                "cellSelectionReset": "cellSelectionReset"
            };

            w.helpers.registerEventHandler(viewModel.events.playClicked, playButtonClickedEventHandler);
            w.helpers.registerEventHandler(viewModel.events.stopClicked, stopButtonClickedEventHandler);
            w.helpers.registerEventHandler(viewModel.events.cellClicked, cellClickedEventHandler);
            w.helpers.registerEventHandler(viewModel.events.engageClicked, engageClickedEventHandler);
            w.helpers.registerEventHandler(viewModel.events.engageClicked, engageClickedEventHandler);
        };

        w.game = new gameConstructor();
    });
})(jQuery, window);