"use client";

import {
  createDetachedSignature,
  getUserCertificates,
  createHash,
} from "crypto-pro";
import { useEffect, useState } from "react";

const MAX_FILE_SIZE = 25000000;

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userCertificates, setUserCertificates] = useState<any[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<string>("");

  useEffect(() => {
    getUserCertificates().then((certificates: any) => {
      certificates[0].getAlgorithm().then((info: any) => {
        // Если надо проверить что алгоритм подписи ГОСТ Р 34.10-2012 256 бит
        console.log(info.oid === "1.2.643.7.1.1.1.1");
      });
      setUserCertificates(certificates);
    });
  }, []);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const data = new FormData();
    if (selectedFile) {
      readFile(selectedFile).then((data: any) => {
        console.log(selectedCertificate);
        const [fileData, fileName] = data;
        createHash(fileData).then((fileHash: string) => {
          createDetachedSignature(selectedCertificate, fileHash).then(
            (signature) => {
              let signName = fileName.split(".");
              signName.pop();
              download(signName + ".sig", signature);
            }
          );
        });
      });
    }
  };

  const download = (filename: string, text: string) => {
    var pom = document.createElement("a");
    pom.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(text)
    );
    pom.setAttribute("download", filename);
    if (document.createEvent) {
      var event = document.createEvent("MouseEvents");
      event.initEvent("click", true, true);
      pom.dispatchEvent(event);
    } else {
      pom.click();
    }
  };

  const readFile = (messageFile: File) => {
    return new Promise(function (resolve, reject) {
      var fileReader = new FileReader();

      fileReader.onload = function () {
        resolve([this.result, messageFile.name]);
      };

      if (messageFile.size > MAX_FILE_SIZE) {
        reject(
          "Файл для подписи не должен превышать " +
            MAX_FILE_SIZE / 1000000 +
            "МБ"
        );

        return;
      }

      fileReader.readAsArrayBuffer(messageFile);
    });
  };
  const onChangeSelectedFile = (e: any) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleOptionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCertificate(event.target.value);
  };
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <form onSubmit={handleSubmit}>
        <label>
          Файл для подписи:
          <input type="file" onChange={onChangeSelectedFile} />
        </label>
        <div>
          <label htmlFor="selectOption">Выберите сертификат:</label>
          <select
            id="selectOption"
            value={selectedCertificate}
            onChange={handleOptionChange}
          >
            <option value="">-- Выберите сертификат --</option>
            {userCertificates.map((certificate) => (
              <option
                key={certificate.thumbprint}
                value={certificate.thumbprint}
              >
                {certificate.name}
              </option>
            ))}
          </select>
        </div>
        <input type="submit" value="Отправить" />
      </form>
    </main>
  );
}
