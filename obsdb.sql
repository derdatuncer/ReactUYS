-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema uni_yonetim
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema uni_yonetim
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `uni_yonetim` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `uni_yonetim` ;

-- -----------------------------------------------------
-- Table `uni_yonetim`.`bolum`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `uni_yonetim`.`bolum` (
  `bolum_id`  NOT NULL,
  `ad` VARCHAR(100) NOT NULL,
  `fakulte` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`bolum_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 7
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `uni_yonetim`.`ogrenci`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `uni_yonetim`.`ogrenci` (
  `ogrenci_no`  NOT NULL,
  `ad` VARCHAR(50) NOT NULL,
  `soyad` VARCHAR(50) NOT NULL,
  `e_posta` VARCHAR(100) NOT NULL,
  `telefon` VARCHAR(10) NULL DEFAULT NULL,
  `sinif` VARCHAR(10) NULL DEFAULT NULL,
  `statu` ENUM('aktif', 'pasif') NOT NULL DEFAULT 'pasif',
  `bolum_id`  NOT NULL,
  PRIMARY KEY (`ogrenci_no`),
  UNIQUE INDEX `e_posta` (`e_posta` ASC) VISIBLE,
  INDEX `bolum_id` (`bolum_id` ASC) VISIBLE,
  CONSTRAINT `ogrenci_ibfk_1`
    FOREIGN KEY (`bolum_id`)
    REFERENCES `uni_yonetim`.`bolum` (`bolum_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `uni_yonetim`.`ogretim_uyesi`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `uni_yonetim`.`ogretim_uyesi` (
  `ogretmen_id`  NOT NULL,
  `ad` VARCHAR(50) NOT NULL,
  `soyad` VARCHAR(50) NOT NULL,
  `e_posta` VARCHAR(100) NOT NULL,
  `unvan` VARCHAR(30) NULL DEFAULT NULL,
  `bolum_id`  NOT NULL,
  PRIMARY KEY (`ogretmen_id`),
  UNIQUE INDEX `e_posta` (`e_posta` ASC) VISIBLE,
  INDEX `bolum_id` (`bolum_id` ASC) VISIBLE,
  CONSTRAINT `ogretim_uyesi_ibfk_1`
    FOREIGN KEY (`bolum_id`)
    REFERENCES `uni_yonetim`.`bolum` (`bolum_id`))
ENGINE = InnoDB
AUTO_INCREMENT = 7
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `uni_yonetim`.`danismanlik`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `uni_yonetim`.`danismanlik` (
  `ogrenci_no`  NOT NULL,
  `ogretmen_id`  NULL DEFAULT NULL,
  PRIMARY KEY (`ogrenci_no`),
  INDEX `ogretmen_id` (`ogretmen_id` ASC) VISIBLE,
  CONSTRAINT `danismanlik_ibfk_1`
    FOREIGN KEY (`ogrenci_no`)
    REFERENCES `uni_yonetim`.`ogrenci` (`ogrenci_no`),
  CONSTRAINT `danismanlik_ibfk_2`
    FOREIGN KEY (`ogretmen_id`)
    REFERENCES `uni_yonetim`.`ogretim_uyesi` (`ogretmen_id`),
  CONSTRAINT `fk_danismanlik_ogrenci`
    FOREIGN KEY (`ogrenci_no`)
    REFERENCES `uni_yonetim`.`ogrenci` (`ogrenci_no`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `uni_yonetim`.`ders`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `uni_yonetim`.`ders` (
  `ders_kodu` VARCHAR(10) NOT NULL,
  `ad` VARCHAR(100) NOT NULL,
  `kredi`  NOT NULL,
  `donem` ENUM('GUZ', 'BAHAR', 'YAZ') NULL DEFAULT NULL,
  `zorunlu_mu` (1) NULL DEFAULT NULL,
  `bolum_id`  NULL DEFAULT NULL,
  PRIMARY KEY (`ders_kodu`),
  INDEX `bolum_id` (`bolum_id` ASC) VISIBLE,
  CONSTRAINT `ders_ibfk_1`
    FOREIGN KEY (`bolum_id`)
    REFERENCES `uni_yonetim`.`bolum` (`bolum_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `uni_yonetim`.`ders_kaydi`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `uni_yonetim`.`ders_kaydi` (
  `ogrenci_no`  NOT NULL,
  `ders_kodu` VARCHAR(10) NOT NULL,
  `yil` YEAR NOT NULL,
  `donem` ENUM('GUZ', 'BAHAR', 'YAZ') NOT NULL,
  `notu` FLOAT NULL DEFAULT NULL,
  PRIMARY KEY (`ogrenci_no`, `ders_kodu`, `yil`, `donem`),
  INDEX `ders_kodu` (`ders_kodu` ASC) VISIBLE,
  CONSTRAINT `ders_kaydi_ibfk_1`
    FOREIGN KEY (`ogrenci_no`)
    REFERENCES `uni_yonetim`.`ogrenci` (`ogrenci_no`),
  CONSTRAINT `ders_kaydi_ibfk_2`
    FOREIGN KEY (`ders_kodu`)
    REFERENCES `uni_yonetim`.`ders` (`ders_kodu`),
  CONSTRAINT `fk_ders_kaydi_ogrenci`
    FOREIGN KEY (`ogrenci_no`)
    REFERENCES `uni_yonetim`.`ogrenci` (`ogrenci_no`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `uni_yonetim`.`ders_verme`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `uni_yonetim`.`ders_verme` (
  `ders_kodu` VARCHAR(10) NOT NULL,
  `ogretmen_id`  NULL DEFAULT NULL,
  PRIMARY KEY (`ders_kodu`),
  INDEX `ogretmen_id` (`ogretmen_id` ASC) VISIBLE,
  CONSTRAINT `ders_verme_ibfk_1`
    FOREIGN KEY (`ders_kodu`)
    REFERENCES `uni_yonetim`.`ders` (`ders_kodu`),
  CONSTRAINT `ders_verme_ibfk_2`
    FOREIGN KEY (`ogretmen_id`)
    REFERENCES `uni_yonetim`.`ogretim_uyesi` (`ogretmen_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `uni_yonetim`.`derslik`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `uni_yonetim`.`derslik` (
  `derslik_id`  NOT NULL,
  `bina` VARCHAR(50) NOT NULL,
  `kat`  NOT NULL,
  `kapasite`  NOT NULL,
  PRIMARY KEY (`derslik_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `uni_yonetim`.`islenme`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `uni_yonetim`.`islenme` (
  `ders_kodu` VARCHAR(10) NOT NULL,
  `derslik_id`  NOT NULL,
  `gun` VARCHAR(10) NOT NULL,
  `saat`  NOT NULL,
  PRIMARY KEY (`ders_kodu`, `derslik_id`, `gun`, `saat`),
  INDEX `derslik_id` (`derslik_id` ASC) VISIBLE,
  CONSTRAINT `islenme_ibfk_1`
    FOREIGN KEY (`ders_kodu`)
    REFERENCES `uni_yonetim`.`ders` (`ders_kodu`),
  CONSTRAINT `islenme_ibfk_2`
    FOREIGN KEY (`derslik_id`)
    REFERENCES `uni_yonetim`.`derslik` (`derslik_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `uni_yonetim`.`kullanici`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `uni_yonetim`.`kullanici` (
  `kullanici_id`  NOT NULL,
  `kullanici_adi` VARCHAR(50) NOT NULL,
  `sifre` VARCHAR(100) NOT NULL,
  `rol` ENUM('ogrenci', 'ogretim_gorevlisi', 'yonetici') NOT NULL,
  PRIMARY KEY (`kullanici_id`),
  UNIQUE INDEX `kullanici_adi` (`kullanici_adi` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 9
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `uni_yonetim`.`on_kosul`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `uni_yonetim`.`on_kosul` (
  `ders_kodu` VARCHAR(10) NOT NULL,
  `on_kosul_kodu` VARCHAR(10) NOT NULL,
  PRIMARY KEY (`ders_kodu`, `on_kosul_kodu`),
  INDEX `on_kosul_kodu` (`on_kosul_kodu` ASC) VISIBLE,
  CONSTRAINT `on_kosul_ibfk_1`
    FOREIGN KEY (`ders_kodu`)
    REFERENCES `uni_yonetim`.`ders` (`ders_kodu`),
  CONSTRAINT `on_kosul_ibfk_2`
    FOREIGN KEY (`on_kosul_kodu`)
    REFERENCES `uni_yonetim`.`ders` (`ders_kodu`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `uni_yonetim`.`veli`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `uni_yonetim`.`veli` (
  `veli_id`  NOT NULL,
  `ad` VARCHAR(50) NOT NULL,
  `soyad` VARCHAR(50) NOT NULL,
  `telefon` VARCHAR(10) NOT NULL,
  `e_posta` VARCHAR(100) NULL DEFAULT NULL,
  PRIMARY KEY (`veli_id`),
  UNIQUE INDEX `e_posta` (`e_posta` ASC) VISIBLE)
ENGINE = InnoDB
AUTO_INCREMENT = 5
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `uni_yonetim`.`veli_ogrenci`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `uni_yonetim`.`veli_ogrenci` (
  `ogrenci_no`  NOT NULL,
  `veli_id`  NULL DEFAULT NULL,
  PRIMARY KEY (`ogrenci_no`),
  INDEX `veli_id` (`veli_id` ASC) VISIBLE,
  CONSTRAINT `fk_veli_ogrenci_ogrenci`
    FOREIGN KEY (`ogrenci_no`)
    REFERENCES `uni_yonetim`.`ogrenci` (`ogrenci_no`)
    ON DELETE CASCADE,
  CONSTRAINT `veli_ogrenci_ibfk_1`
    FOREIGN KEY (`ogrenci_no`)
    REFERENCES `uni_yonetim`.`ogrenci` (`ogrenci_no`),
  CONSTRAINT `veli_ogrenci_ibfk_2`
    FOREIGN KEY (`veli_id`)
    REFERENCES `uni_yonetim`.`veli` (`veli_id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
