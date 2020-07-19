/**
 * config: {
 *     extensions: [],
 *     tokenKey: "",
 *     token: "",
 *     uploadUrl: ""
 * },
 * callBack: function(result, errorCode, message, response);
 */
(function (angular) {
    var upload = angular.module("module.cloudpayfull.upload", ["angularFileUpload"]);
    upload.directive("cpfUpload", function () {
        return {
            restrict: "EA",
            scope: {
                config: "@",
                callBack: "&",
                uploadUrl: "="
            },
            replace: true,
            template:
                "<div class='container-fluid cpf-upload'>"+
                "    <input type='file' id='uploadFile'  nv-file-select='' uploader='uploader'>" +
                "    <div class='row' nv-file-drop='' uploader='uploader' onclick='$(this).parent().children(\"input\").eq(0).click();' " +
                "        ng-if='uploader.queue.length < _config.maxCount && uploader.isHTML5'>" +
                "        <div nv-file-over='' uploader='uploader' over-class='another-file-over-class' class='well my-drop-zone'>" +
                "            拖拽或点击上传<hr/>（请选择<span ng-repeat='ext in _config.extensions'>.{{ext}},</span> 格式文件上传）" +
                "        </div>" +
                "    </div>" +
                "    <div class='row well' ng-repeat='item in uploader.queue'>" +
                "        <div class='col-xs-10 col-lg-11' style=''>" +
                "            <div class='row'>" +
                "                <label class='col-xs-9'>文件名: {{item.file.name}}</label>" +
                "                <div class='col-xs-3 text-right'>{{ item.file.size | dataSize }}</div>" +
                "            </div>" +
                "            <div class='row' ng-show='!item.isSuccess && !item.isUploading'>" +
                "                <button ng-click='item.upload()' class='btn btn-success form-control' " +
                "                   ng-disabled='item.isReady || item.isUploading || item.isSuccess' >上传</button>" +
                "            </div>" +
                "            <div class='row' ng-show='item.isSuccess || item.isUploading'>" +
                "                <div class='progress' style='height: 28px; background-color: #EEEEEE'>" +
                "                    <div class='progress-bar' role='progressbar' ng-style=\"{ 'width': item.progress + '%' }\">" +
                "                        <span ng-if='item.isUploading'>{{item.progress}}%</span>" +
                "                        <span ng-show='item.isSuccess'><i class='glyphicon glyphicon-ok'></i>上传成功</span>" +
                "                    </div>" +
                "                </div>" +
                "            </div>" +
                "        </div>" +
                "        <div class='col-xs-2 col-lg-1'>" +
                "            <button type='button' class='btn btn-danger btn-lg' ng-click='removeItem(item)'><i class='fa fa-trash-o fa-3x'></i></button>" +
                "        </div>" +
                "    </div>" +
                "</div>",
            controller: ["$scope", "FileUploader", "$CPFUpload", function ($scope, FileUploader, $CPFUpload) {
                var config = {
                    extensions: $CPFUpload.fileExtensions,
                    tokenKey: $CPFUpload.tokenKey,
                    maxCount: $CPFUpload.maxCount
                };
                $scope._config = config = angular.extend(config, JSON.parse($scope.config));

                var uploader = $scope.uploader = new FileUploader({});//创建一个文件上传对象
                if (config.token && config.tokenKey) {
                    uploader.headers[config.tokenKey] = config.token;
                } else {
                    console.warn("Please set the token code!");
                }
                $scope.$watch("uploadUrl", function () {
                    uploader.url = $scope.uploadUrl;
                });
                uploader.filters.push({
                    name: 'extensionFilter',
                    fn: function(item, options) {
                        var checkResult = $CPFUpload.checkExtension(config.extensions, item.name);
                        if (!checkResult) {
                            return $scope.callBack({result: false, errorCode: "10", message: "不支持此文件类型"});
                        }
                        return checkResult;
                    }
                }, {
                    name: 'fileCountFilter',
                    fn: function(item) {
                        for (var i = 0; i < this.queue.length; i++) {
                            if (this.queue[i].file.name == item.name && this.queue[i].file.size == item.size && this.queue[i].file.lastModified == item.lastModified) return false;
                        }
                        if(this.queue.length > config.maxCount){//当队列已存在一个文件时，无法继续添加
                            return $scope.callBack({result: false, errorCode: "11", message: "只能上传 " + config.maxCount + " 个文件！"});
                        }
                        return true;
                    }
                });

                /**
                 * 移除文件
                 * @param item
                 */
                $scope.removeItem = function(item){
                    $scope.forbidConfirm = true;
                    item.cancel();
                    item.remove();
                };
                $scope.checkFileName = function(){
                    var fileName = $scope.fileName;
                    if (typeof $scope.fileExtensions == "object") {
                        return $CPFUpload.checkExtension($scope.fileExtensions, fileName);
                    }
                };
                // 文件上传回调函数
                uploader.onCompleteItem = function(fileItem, response, status, headers) {
                    if (status != 200 && status != 0) {
                        $scope.callBack({result: false, errorCode: "09", message: response.message});
                    } else {
                        $scope.callBack({result: true, response: response});
                    }
                };
            }]
        }
    });
    upload.provider("$CPFUpload", function () {
        this.tokenKey = "WEB-TOKEN";
        this.maxCount = 1,
        this.officeExtensions = ["xls", "xlsx", "doc", "docx", "ppt", "pptx"];
        this.zipExtensions = ["zip", "rar", "7z"];
        this.imgExtensions = ["jpg", "jpeg", "bmp", "gif", "png"];
        this.pdfExtensions = ["pdf"];
        this.otherExtensions = ["txt"];
        this.fileExtensions = [
            // -- office start --
            "xls", "xlsx", "doc", "docx", "ppt", "pptx",
            // -- 压缩 start --
            "zip", "rar", "7z",
            // -- img start --
            "jpg", "jpeg", "bmp", "gif", "png",
            // -- OTHER --
            "pdf", "txt"
        ];
        this.checkExtension = function(fileExtensions, fileName) {
            var fileExt = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
            for (var i = 0; i < fileExtensions.length; i ++) {
                var ext = fileExtensions[i];
                if (ext.toLowerCase() == fileExt.toLowerCase()) return true;
            }
            return false;
        }
        this.$get = function () {
            return this;
        };
    });
    upload.filter("dataSize", function () {
        return function (dataSize) {
            var ret = dataSize, unit = "byte";
            while (ret > 1000) {
                ret = ret / 1000;
                if (unit == "byte") {
                    unit = "Kb";
                } else if (unit == "Kb") {
                    unit = "Mb";
                } else if (unit == "Mb") {
                    unit = "Gb";
                    break;
                }
            }
            return ret.toFixed(2) + " " + unit;
        }
    })
})(angular);