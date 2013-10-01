//
//  ActivityDetailViewController.m
//  Activities
//
//  Created by Owen Campbell-Moore on 01/08/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import "ActivityDetailViewController.h"
#import "GlobalStyles.h"

@interface ActivityDetailViewController ()

@end

@implementation ActivityDetailViewController

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        self.title = @"Activity Detail";
    }
    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    self.view.backgroundColor = [[GlobalStyles sharedGlobal] backgroundGreyColor];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

@end
